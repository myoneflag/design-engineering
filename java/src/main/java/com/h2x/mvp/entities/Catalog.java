package com.h2x.mvp.entities;

import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@TypeDef(
        name = "jsonb",
        typeClass = JsonBinaryType.class
)
public class Catalog {
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public Document getDocument() {
        return document;
    }

    public void setDocument(Document document) {
        this.document = document;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getSavedOn() {
        return savedOn;
    }

    public void setSavedOn(LocalDateTime savedOn) {
        this.savedOn = savedOn;
    }

    @Id
    @GeneratedValue
    private int id;

    @OneToOne(optional = true)
    private Document document;

    @Type(type = "jsonb")
    @Column(columnDefinition = "jsonb")
    private String content;

    private LocalDateTime savedOn;
}
