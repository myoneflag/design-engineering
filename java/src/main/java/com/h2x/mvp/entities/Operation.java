package com.h2x.mvp.entities;

import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;

import javax.persistence.*;

@Entity
@TypeDef(
        name = "jsonb",
        typeClass = JsonBinaryType.class
)
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


    @Type(type = "jsonb")
    @Column(columnDefinition = "jsonb")
    private String operation;
}
