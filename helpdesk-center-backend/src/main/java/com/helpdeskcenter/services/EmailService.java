package com.helpdeskcenter.services;

import com.helpdeskcenter.entities.Ticket;
import com.helpdeskcenter.entities.TicketMessage;
import com.helpdeskcenter.entities.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

/**
 * Sends transactional emails asynchronously so that the HTTP request
 * completing a comment POST is never blocked by SMTP latency.
 *
 * Requires these environment variables:
 *   MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM
 *   APP_BASE_URL  (e.g. https://your-app.vercel.app)
 */
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from:no-reply@helpdesk.local}")
    private String fromAddress;

    @Value("${app.base-url:http://localhost:5173}")
    private String appBaseUrl;

    /**
     * Sends a "new comment on your ticket" email to the given recipient.
     * Called after a comment is persisted; runs on a separate thread pool thread.
     */
    @Async
    public void sendNewCommentNotification(User recipient, TicketMessage message, Ticket ticket) {
        try {
            Context ctx = new Context();
            ctx.setVariable("recipientName",  recipient.getName());
            ctx.setVariable("senderName",     message.getSender().getName());
            ctx.setVariable("ticketId",       ticket.getId());
            ctx.setVariable("ticketTitle",    ticket.getTitle());
            ctx.setVariable("commentBody",    message.getBody());
            ctx.setVariable("ticketUrl",      appBaseUrl + "/tickets/" + ticket.getId());

            String html = templateEngine.process("email/new-comment", ctx);

            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(recipient.getEmail());
            helper.setSubject("New reply on ticket TCK-" + ticket.getId() + ": " + ticket.getTitle());
            helper.setText(html, true);

            mailSender.send(mime);
            log.info("[Mail] Sent new-comment email to {} for ticket {}", recipient.getEmail(), ticket.getId());
        } catch (MessagingException e) {
            log.error("[Mail] Failed to send new-comment email to {}: {}", recipient.getEmail(), e.getMessage());
        }
    }

    /**
     * Sends a "ticket assigned to you" email to the assignee.
     */
    @Async
    public void sendTicketAssignedNotification(User assignee, Ticket ticket) {
        try {
            Context ctx = new Context();
            ctx.setVariable("recipientName", assignee.getName());
            ctx.setVariable("ticketId",      ticket.getId());
            ctx.setVariable("ticketTitle",   ticket.getTitle());
            ctx.setVariable("ticketUrl",     appBaseUrl + "/tickets/" + ticket.getId());
            ctx.setVariable("priority",      ticket.getPriority().name());

            String html = templateEngine.process("email/ticket-assigned", ctx);

            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(assignee.getEmail());
            helper.setSubject("You've been assigned ticket TCK-" + ticket.getId() + ": " + ticket.getTitle());
            helper.setText(html, true);

            mailSender.send(mime);
            log.info("[Mail] Sent ticket-assigned email to {} for ticket {}", assignee.getEmail(), ticket.getId());
        } catch (MessagingException e) {
            log.error("[Mail] Failed to send ticket-assigned email to {}: {}", assignee.getEmail(), e.getMessage());
        }
    }
}
