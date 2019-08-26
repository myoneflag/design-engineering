package com.h2x.mvp.webmodels;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import org.immutables.value.Value;

@Value.Immutable
@JsonSerialize(as = ImmutablePaperSize.class)
@JsonDeserialize(as = ImmutablePaperSize.class)
public interface PaperSize {
    String name();
    double width();
    double height();
}
