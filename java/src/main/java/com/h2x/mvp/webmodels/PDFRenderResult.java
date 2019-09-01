package com.h2x.mvp.webmodels;


import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import org.immutables.value.Value;

@Value.Immutable
@JsonSerialize(as = ImmutablePDFRenderResult.class)
@JsonDeserialize(as = ImmutablePDFRenderResult.class)
public interface PDFRenderResult {
    String scaleName();
    Double scale();
    PaperSize paperSize();
    String uri();
    int totalPages();
}
