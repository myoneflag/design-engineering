package com.h2x.mvp.entities;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.ManyToOne;

@Entity
public class Operation {
    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    public Document getDocument() {
        return document;
    }

    public void setDocument(Document document) {
        this.document = document;
    }

    public int getOrderIndex() {
        return orderIndex;
    }

    public void setOrderIndex(int order) {
        this.orderIndex = order;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    @Id
    @GeneratedValue
    private int id;

    private int orderIndex;

    @ManyToOne
    private Document document;

    private String operation;
}
