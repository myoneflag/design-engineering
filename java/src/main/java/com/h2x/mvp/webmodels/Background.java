package com.h2x.mvp.webmodels;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import org.immutables.value.Value;

@Value.Immutable
@JsonSerialize(as = ImmutableBackground.class)
@JsonDeserialize(as = ImmutableBackground.class)
public interface Background {
    Coord center();
    Rectangle crop();
    String scaleName();
    double scaleFactor();
    String uri();
    PaperSize paperSize();
    double rotation();

    int page();
    int totalPages();
}