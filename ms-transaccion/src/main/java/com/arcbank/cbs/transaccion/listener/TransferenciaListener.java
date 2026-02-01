package com.arcbank.cbs.transaccion.listener;

import com.arcbank.cbs.transaccion.client.WebhookClient;
import com.arcbank.cbs.transaccion.dto.rabbitmq.TransferenciaDTO;
import com.arcbank.cbs.transaccion.service.TransaccionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Slf4j
@Component
@RequiredArgsConstructor
public class TransferenciaListener {

    private final TransaccionService transaccionService;
    private final WebhookClient webhookClient;

    @RabbitListener(queues = "${app.rabbitmq.queue:q.bank.BANTEC.in}")
    public void recibirTransferencia(TransferenciaDTO mensaje) {
        log.info("Recibida transferencia RabbitMQ: {} por ${}",
                mensaje.getBody().getInstructionId(),
                mensaje.getBody().getAmount().getValue());

        try {
            transaccionService.procesarDeposito(
                    mensaje.getBody().getCreditor().getAccountId(),
                    mensaje.getBody().getAmount().getValue(),
                    mensaje.getBody().getDebtor().getName(),
                    mensaje.getBody().getInstructionId());

            webhookClient.confirmarTransaccion(
                    mensaje.getHeader().getOriginatingBankId(),
                    mensaje.getBody().getInstructionId(),
                    "COMPLETED");

            log.info("Confirmación enviada para Tx: {}", mensaje.getBody().getInstructionId());

        } catch (Exception e) {
            String errorMsg = e.getMessage();
            log.error("Error procesando transferencia entrante: {}", errorMsg);

            if (errorMsg != null && (errorMsg.contains("AC03") || errorMsg.contains("AM04"))) {
                throw new AmqpRejectAndDontRequeueException(errorMsg, e);
            } else {
                throw e;
            }
        }
    }
}
