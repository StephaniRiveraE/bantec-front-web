package com.arcbank.cbs.transaccion.config;

import feign.Client;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.io.HttpClientConnectionManager;
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactory;
import org.apache.hc.core5.ssl.SSLContextBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import javax.net.ssl.SSLContext;
import java.io.InputStream;
import java.security.KeyStore;

/**
 * Configuración de mTLS (Mutual TLS) para comunicación segura con el Switch
 * DIGICONECU
 * 
 * Esta configuración permite que Bantec envíe su certificado al Switch para
 * autenticación mutua.
 */
@Configuration
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

    /**
     * Cliente Feign configurado con mTLS
     * Solo se activa si app.mtls.enabled=true
     */
    @Bean
    public Client feignClient() throws Exception {
        if (!mtlsEnabled) {
            // Si mTLS no está habilitado, usar cliente por defecto
            return new Client.Default(null, null);
        }

        // Cargar KeyStore (certificado del banco)
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        try (InputStream keyStoreStream = keystoreResource.getInputStream()) {
            keyStore.load(keyStoreStream, keystorePassword.toCharArray());
        }

        // Cargar TrustStore (certificados confiables del Switch)
        KeyStore trustStore = KeyStore.getInstance("PKCS12");
        try (InputStream trustStoreStream = truststoreResource.getInputStream()) {
            trustStore.load(trustStoreStream, truststorePassword.toCharArray());
        }

        // Crear SSLContext con autenticación mutua
        SSLContext sslContext = SSLContextBuilder.create()
                .loadKeyMaterial(keyStore, keystorePassword.toCharArray())
                .loadTrustMaterial(trustStore, null)
                .build();

        SSLConnectionSocketFactory sslSocketFactory = new SSLConnectionSocketFactory(sslContext);

        HttpClientConnectionManager connectionManager = PoolingHttpClientConnectionManagerBuilder.create()
                .setSSLSocketFactory(sslSocketFactory)
                .build();

        CloseableHttpClient httpClient = HttpClients.custom()
                .setConnectionManager(connectionManager)
                .build();

        return new feign.hc5.ApacheHttp5Client(httpClient);
    }
}
