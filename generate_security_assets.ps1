# Generate RSA Keys for JWS (Signing)
# 1. Private Key (PKCS8)
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# 2. Public Key (from Private Key)
openssl rsa -pubout -in private_key.pem -out public_key.pem

# 3. Convert Private Key to DER (optional, but Java prefers it sometimes, though PEM is fine with BouncyCastle or newer Java)
# We will use PEM in code if possible, or keytool.
# Let's clean up to just PEMs for JWS.

# Generate Certificates for mTLS
# 1. Generate Keystore with a Self-Signed Certificate
# Password will be 'bantec123' as per application.yaml checks
keytool -genkeypair -alias bantec-client -keyalg RSA -keysize 2048 -storetype PKCS12 -keystore bantec-keystore.p12 -validity 3650 -storepass bantec123 -dname "CN=Bantec, OU=IT, O=Bantec, L=Quito, C=EC" -keypass bantec123

# 2. Export the Public Certificate (to give to other banks)
keytool -exportcert -alias bantec-client -keystore bantec-keystore.p12 -storepass bantec123 -file bantec-public-cert.crt

# 3. Create a Truststore and import the same cert (for loopback testing or just to have a file)
# In production, this would contain the OTHER bank's cert. For now, we seed it with our own so it's not empty.
keytool -importcert -alias bantec-self -file bantec-public-cert.crt -keystore bantec-truststore.p12 -storepass bantec123 -noprompt

# Move files to final location
Move-Item -Path private_key.pem -Destination "c:\Users\vinue\BnacoBantec\ms-transaccion\src\main\resources\certs\private_key.pem" -Force
Move-Item -Path public_key.pem -Destination "c:\Users\vinue\BnacoBantec\ms-transaccion\src\main\resources\certs\public_key.pem" -Force
Move-Item -Path bantec-keystore.p12 -Destination "c:\Users\vinue\BnacoBantec\ms-transaccion\src\main\resources\certs\bantec-keystore.p12" -Force
Move-Item -Path bantec-truststore.p12 -Destination "c:\Users\vinue\BnacoBantec\ms-transaccion\src\main\resources\certs\bantec-truststore.p12" -Force
Move-Item -Path bantec-public-cert.crt -Destination "c:\Users\vinue\BnacoBantec\ms-transaccion\src\main\resources\certs\bantec-public-cert.crt" -Force

Write-Host "Certificates and Keys generated in src/main/resources/certs"
