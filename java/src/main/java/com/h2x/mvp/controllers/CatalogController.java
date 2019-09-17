package com.h2x.mvp.controllers;

import com.h2x.mvp.entities.Document;
import com.h2x.mvp.entities.Operation;
import com.h2x.mvp.entities.Session;
import org.springframework.boot.json.JsonParser;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.HandlerMapping;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;

import static com.h2x.mvp.entities.Database.getDefaultCatalog;
import static com.h2x.mvp.entities.Database.withSession;

// This is for document entities, and drawings.
@RestController
public class CatalogController {

    @RequestMapping("api/catalog/**")
    public ResponseEntity<String> ApplyOperation(@CookieValue("session-id") String sessionId, HttpServletRequest request) {
        // There should only be one document in the database.
        String pathtail = request.getAttribute( HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE )
                .toString()
                .substring("api/catalog/".length());

        try {
            return Session.<ResponseEntity<String>, IOException>withAuthAndDb(sessionId, (s, session) -> {
                return ResponseEntity.status(200).body(getDefaultCatalog(s).getContent());
            }, ResponseEntity.status(403).body("Unauthorised"));
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error creating initial catalog to datablase");
        }
    }
}
