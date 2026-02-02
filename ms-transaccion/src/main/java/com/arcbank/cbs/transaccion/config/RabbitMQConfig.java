package com.arcbank.cbs.transaccion.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${app.rabbitmq.queue:q.bank.BANTEC.in}")
    private String queueName;

    /**
     * Define explícitamente la cola.
     * durable = true (porque el Switch seguramente la creó así para persistencia)
     */
    @Bean
    public Queue bantecQueue() {
        return new Queue(queueName, true);
    }

    /**
     * Conversor para manejar JSON automáticamente.
     * Sin esto, Spring espera serialización Java nativa y falla con mensajes de
     * texto/json.
     */
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * Plantilla de Rabbit con el conversor JSON configurado.
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
