package com.h2x.mvp.entities;

import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.hibernate.cfg.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.json.JsonParser;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.util.ResourceUtils;

import java.awt.dnd.DropTarget;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.List;
import java.util.function.Function;

public class Database {
    public static SessionFactory factory = new Configuration().configure().buildSessionFactory();
    static Logger logger = LoggerFactory.getLogger(Database.class.getName());

    public static <T, K extends Throwable> T withSession(SessionHandler<T, K> fun) throws K {
        Session session = Database.factory.openSession();
        Transaction tx = null;

        try {
            tx =  session.beginTransaction();
            T res = fun.apply(session);
            tx.commit();
            session.close();
            return res;
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            e.printStackTrace();
            session.close();
            throw e;
        }
    }

    static JsonParser jp = JsonParserFactory.getJsonParser();

    public static Catalog createAndPersistDefaultCatalog(Session session) throws IOException {
        // create default one
        logger.debug("Creating default catalog because one doesn't exist already");
        Catalog catalog = new Catalog();
        catalog.setDocument(null);
        catalog.setSavedOn(LocalDateTime.now());

        File file = ResourceUtils.getFile("classpath:initial-catalog.json");
        catalog.setContent(new String(new FileInputStream(file).readAllBytes(), StandardCharsets.UTF_8));
        _defaultCatalogLastSaved = LocalDateTime.parse(
                jp.parseMap(catalog.getContent()).get("lastModified").toString(),
                DateTimeFormatter.ISO_LOCAL_DATE_TIME
        );
        session.persist(catalog);
        return catalog;
    }

    public static LocalDateTime _defaultCatalogLastSaved = null;

    public static LocalDateTime defaultCatalogLastSaved() throws IOException {
        if (_defaultCatalogLastSaved == null) {
            File file = ResourceUtils.getFile("classpath:initial-catalog.json");
            String content = new String(new FileInputStream(file).readAllBytes(), StandardCharsets.UTF_8);
            _defaultCatalogLastSaved = LocalDateTime.parse(
                    jp.parseMap(content).get("lastModified").toString(),
                    DateTimeFormatter.ISO_LOCAL_DATE_TIME
            );
        }
        return _defaultCatalogLastSaved;
    }

    public static Catalog getDefaultCatalog(Session session) throws IOException {
        List<Catalog> catalogList = session.createQuery("FROM Catalog AS C WHERE C.document = null").list();
        if (catalogList.size() == 0) {
            return createAndPersistDefaultCatalog(session);
        } else if (catalogList.size() != 1) {
            throw new InvalidObjectException("There are more than one catalogs");
        } else {
            // Check that the catalog in the database isn't out of date
            if (catalogList.get(0).getSavedOn() == null ||
                    catalogList.get(0).getSavedOn().isBefore(defaultCatalogLastSaved())) {
                session.delete(catalogList.get(0));
                return createAndPersistDefaultCatalog(session);
            } else {
                return catalogList.get(0);
            }
        }
    }
}
