package com.h2x.mvp.controllers;

import com.h2x.mvp.configuration.SecurityConfig;
import com.h2x.mvp.entities.ContactMessage;
import com.h2x.mvp.entities.Database;
import com.h2x.mvp.entities.Login;
import org.apache.tomcat.util.codec.binary.Base64;
import org.springframework.web.bind.annotation.*;

import javax.mail.Message;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Properties;

@RestController
public class ContactController {

    @RequestMapping("api/contact")
    public ContactResult login(@RequestBody ContactRequest message) {
        ContactResult result = Database.withSession((s) -> {
            try {

                ContactMessage msg = new ContactMessage();
                msg.setEmail(message.email);
                msg.setName(message.name);
                msg.setMessage(message.message);
                s.save(msg);

                // email
                Properties prop = new Properties();

                prop.put("mail.smtp.host", "smtp.gmail.com");
                prop.put("mail.smtp.port", "587");
                prop.put("mail.smtp.auth", "true");
                prop.put("mail.smtp.starttls.enable", "true"); //TLS

                Session session = Session.getInstance(prop,
                        new javax.mail.Authenticator() {
                            protected PasswordAuthentication getPasswordAuthentication() {
                                return new PasswordAuthentication("h2xnoreply@gmail.com", "thisistemporaryomg");
                            }
                        });


                MimeMessage email=new MimeMessage(session);
                email.setFrom(new InternetAddress("h2xnoreply@gmail.com"));
                email.addRecipient(Message.RecipientType.TO,
                        new InternetAddress("jonathanmousdell@gmail.com\n"));
                email.setSubject("New H2X Contact Submission");
                email.setText("Hi Jonathan, here's a new contact message from the page at h2x.maxwu.cloud/contact\n" +
                        "from: " + message.name + "\n" +
                        "email: " + message.email + "\n" +
                        "message: " + message.message + "\n" +
                        "\n\n(This was automatically relayed from the server\n"
                );

                Transport.send(email);

                return new ContactResult(true, "Success");
            } catch (Exception e) {
                return new ContactResult(false, e.getMessage());
            }
        });
        return result;
    }

    public static class ContactResult {
        public ContactResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public boolean success;
        public String message;
    }


    public static class ContactRequest {
        public String name;
        public String  message;
        public String email;
    }
}
