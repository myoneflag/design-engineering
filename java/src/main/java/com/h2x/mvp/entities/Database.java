package com.h2x.mvp.entities;

import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.hibernate.cfg.Configuration;

import java.awt.dnd.DropTarget;
import java.util.function.Function;

public class Database {
    public static SessionFactory factory = new Configuration().configure().buildSessionFactory();

    public static <T> T withSession(Function<Session, T> fun) {
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

    public interface Operation {
        void call(Session session);
    }
}
