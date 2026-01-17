package com.arcbank.cbs.transaccion.config;

import feign.Client;
import feign.RequestInterceptor;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactory;
import org.apache.hc.core5.ssl.SSLContextBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import javax.net.ssl.SSLContext;
import java.io.InputStream;
import java.security.KeyStore;

import org.apache.hc.client5.http.io.HttpClientConnectionManager;

@Configuration
@Slf4j
public class MTLSConfig {

    @Value("${app.mtls.keystore.path:classpath:certs/bantec-keystore.p12}")
    private Resource keystoreResource;

    @Value("${app.mtls.keystore.password:bantec123}")
    private String keystorePassword;

    @Value("${app.mtls.truststore.path:classpath:certs/bantec-truststore.p12}")
    private Resource truststoreResource;

    @Value("${app.mtls.truststore.password:bantec123}")
    private String truststorePassword;

    @Value("${app.mtls.enabled:false}")
    private boolean mtlsEnabled;

    @Value("${app.switch.apikey:}")
    private String apiKey;

    @Bean
    public RequestInterceptor requestInterceptor() {
        return requestTemplate -> {
            if (apiKey != null && !apiKey.isBlank()) {
                requestTemplate.header("apikey", apiKey);
            }
        };
    }

    @Bean
    public Client feignClient() throws Exception {
        if (!mtlsEnabled) {
            log.info("mTLS desactivado para el cliente Feign.");
            return new Client.Default(null, null);
        }

        if (!keystoreResource.exists()) {
            log.error("❌ CRÍTICO: Keystore NO encontrado en {}. La conexión con el Switch fallará si requiere mTLS.",
                    keystoreResource);
            return new Client.Default(null, null);
        }

        log.info("Cargando Keystore desde: {}", keystoreResource);
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        try (InputStream keyStoreStream = keystoreResource.getInputStream()) {
            keyStore.load(keyStoreStream, keystorePassword.toCharArray());
        }

        KeyStore trustStore = KeyStore.getInstance("PKCS12");
        boolean trustStoreLoaded = false;
        if (truststoreResource.exists()) {
            try (InputStream trustStoreStream = truststoreResource.getInputStream()) {
                trustStore.load(trustStoreStream, truststorePassword.toCharArray());
                if (trustStore.size() > 0) {
                    trustStoreLoaded = true;
                    log.info("✅ Truststore cargado exitosamente desde {} ({} certificados)",
                            truststoreResource, trustStore.size());
                } else {
                    log.warn("⚠️ Truststore personalizado está VACÍO. Se usará el del sistema.");
                }
            } catch (Exception e) {
                log.warn("⚠️ Error cargando truststore personalizado: {}. Se usará el del sistema.", e.getMessage());
            }
        } else {
            log.warn("ℹ️ Truststore personalizado no encontrado en {}. Se usará el del sistema.", truststoreResource);
        }

        SSLContextBuilder sslContextBuilder = SSLContextBuilder.create()
                .loadKeyMaterial(keyStore, keystorePassword.toCharArray());

        if (trustStoreLoaded) {
            sslContextBuilder.loadTrustMaterial(trustStore, null);
        } else {
            sslContextBuilder.loadTrustMaterial((java.security.KeyStore) null,
                    (org.apache.hc.core5.ssl.TrustStrategy) null);
            log.info("Using system default truststore.");
        }

        SSLContext sslContext = sslContextBuilder.build();
        SSLConnectionSocketFactory sslSocketFactory = new SSLConnectionSocketFactory(sslContext);

        HttpClientConnectionManager connectionManager = PoolingHttpClientConnectionManagerBuilder.create()
                .setSSLSocketFactory(sslSocketFactory)
                .build();

        CloseableHttpClient httpClient = HttpClients.custom()
                .setConnectionManager(connectionManager)
                .build();

        log.info("🚀 Cliente Feign mTLS configurado correctamente para BTEC -> SWITCH.");
        return new feign.hc5.ApacheHttp5Client(httpClient);
    }
}
