package com.h2x.mvp.controllers;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ForkJoinPool;
import java.util.logging.FileHandler;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.h2x.mvp.webmodels.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.async.DeferredResult;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class PDFServiceController
{
    ObjectMapper mapper = new ObjectMapper();
    static Logger logger = LoggerFactory.getLogger(PDFServiceController.class);

    @Autowired
    @Qualifier("threadConfig")
    TaskExecutor taskExecutor;

    @RequestMapping(value = "api/uploadPdf")
    public DeferredResult<ResponseEntity<PDFRenderResult>> uploadPdf(
            @RequestParam("pdf")MultipartFile file)
    {

        Logger logger = LoggerFactory.getLogger(PDFServiceController.class);
        DeferredResult<ResponseEntity<PDFRenderResult>> output = new DeferredResult<>();
        //return new BackgroundURI("https://conversionxl.com/wp-content/uploads/2013/03/blueprint-architecture.png");
        ForkJoinPool.commonPool().submit(() -> {
            try {
                logger.debug("Starting PDF conversion service");
                // Save to temp dir
                String pdfPath = "/tmp/" + UUID.randomUUID().toString() + ".pdf";
                File pdfFile = new File(pdfPath);
                OutputStream pdfOutput = new FileOutputStream(pdfFile);
                pdfOutput.write(file.getBytes());

                String pngHash = UUID.randomUUID().toString();
                String pngDest = "/static/" + pngHash + ".png";

                logger.debug("Submitting convert task.");
                ForkJoinPool.commonPool().submit(() -> {
                    try {
                        convertToPng(pdfPath, pngHash);
                    } catch (IOException | InterruptedException e) {
                        e.printStackTrace();
                    }
                });
                logger.debug("Submitted convert task. Now pushing operation");

                PdfDims pdfDims = getPdfDimensions(pdfPath);

                logger.debug("Submitted convert task. Now pushing operation 2");
                // We can get the size of the PDF immediately. Then, the operation can be returned to the user
                // already.

                PDFRenderResult result = ImmutablePDFRenderResult.builder()
                        .paperSize(pdfDims.paperSize)
                        .scaleName(pdfDims.scale)
                        .scale(pdfDims.scaleNumber)
                        .uri(pngDest)
                        .totalPages(pdfDims.pages)
                        .build();

                logger.debug("Setting output result");
                output.setResult(ResponseEntity.ok(result));

                logger.debug("Done");

            } catch (IOException e) {
                e.printStackTrace();
                logger.debug("Error when converting PDF");
                output.setResult(ResponseEntity.status(500).build());
            }
        });

        return output;
    }

    private PdfDims getPdfDimensions(String path) throws IOException {
        PDDocument pdf = PDDocument.load(new File(path));
        int pages = pdf.getNumberOfPages();
        // Get a page somewhere in the middle (not title page)
        PDRectangle rect = pdf.getPage(pages/2).getBBox();
        int rotation = pdf.getPage(pages/2).getRotation();
        pdf.getPage(pages/2);

        double w = rect.getWidth();
        double h = rect.getHeight();
        if (rotation == 90 || rotation == 270) {
            double temp = w;
            w = h;
            h =temp;
        }

        // Attempt to get the paper scale and size using heuristics.
        String contents = pdfToString(pdf);

        String paperPattern = PaperSizes.PAPER_SIZES[0].name();
        for (int i = 1; i < PaperSizes.PAPER_SIZES.length; i++) {
            paperPattern += "|" + PaperSizes.PAPER_SIZES[i].name();
        }

        String regexp = "(?:SCALE|Scale|scale)[-: \n\t]*([0-9]+):([0-9]+)[ \n\t]*@?[ \n\t]*(" + paperPattern +")?";
        logger.debug("Regex is:");
        logger.debug(regexp);

        Pattern p = Pattern.compile(regexp, Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(contents);

        String scale = "1:100";
        String paperSize = "Custom";
        double scaleNumber = 1/100.0;
        if (m.find()) {
            logger.debug("Mathcresult: " + m.toMatchResult().toString());
            if (m.groupCount() >= 3 && m.group(3) != null) {
                // We got the paper size bois
                paperSize = m.group(3);
                logger.debug("Found paper size: " + paperSize);
            }

            if (m.groupCount() >= 2) {
                // We got the scale bois
                String l = m.group(1);
                String r = m.group(2);

                logger.debug("PDF found scale: " + l + " : " + r);
                try {
                    int lef, rig;
                    lef = Integer.parseInt(l);
                    rig = Integer.parseInt(r);
                    logger.debug("Scale parsed successfully");
                    scale = lef + ":" + rig;
                    if (rig != 0) {
                        scaleNumber = lef / (double) rig;
                    }
                } catch (Exception e) {
                    logger.debug("Scale couldn't parse, reverting to default");
                }
            }
        } else {
            logger.debug("No match");
        }

        // Try again
        regexp = "SCALE[-: \n\t][ \n\t]*@?[ \n\t]*(" + paperPattern +")";
        p = Pattern.compile(regexp, Pattern.CASE_INSENSITIVE);
        m = p.matcher(contents);

        if (m.find()) {
            if (m.groupCount() >= 1) {
                paperSize = m.group(1);
                logger.debug("Found paper size with second method: " + paperSize);
            }
        }

        for (PaperSize size : PaperSizes.PAPER_SIZES) {
            if (size.name().equals(paperSize)) {
                if (h > w) {
                    h = size.widthMM();
                    w = size.heightMM();
                } else {
                    h = size.heightMM();
                    w = size.widthMM();
                }
            }
        }

        logger.debug("Building result: " + w + " " + h + " " + paperSize);
        // TODO: Find paper sizes and scale properly.
        PdfDims result = new PdfDims(
                pages,
                ImmutablePaperSize.builder().widthMM(w).heightMM(h).name(paperSize).build(),
                scale,
                scaleNumber
        );
        logger.debug("Built");

        return result;
    }

    private static String converToSvg(String pdfPath) throws IOException, InterruptedException {
        // Call pdf2svg
        String svgHash = UUID.randomUUID().toString();
        String svgPath = "/tmp/" + svgHash + ".svg";

        Runtime rt = Runtime.getRuntime();
        Process pr = rt.exec("pdf2svg " + pdfPath + " " + svgPath);
        int retVal = pr.waitFor();

        if (retVal != 0) {
            throw new IOException("Command failed with " + String.valueOf(retVal) + "\n process output: \n" + Arrays.toString(pr.getInputStream().readAllBytes()));
        }

        Files.move(Path.of(svgPath), Path.of("/var/www/h2x/static/" + svgHash + ".svg"));

        return "static/" + svgHash + ".svg";
    }

    private static String pdfToString(PDDocument doc) throws IOException {
        PDFTextStripper pdfStripper;

        pdfStripper = new PDFTextStripper();
        pdfStripper.setStartPage(1);
        pdfStripper.setEndPage(doc.getNumberOfPages());
        String parsedText = pdfStripper.getText(doc);
        logger.debug(parsedText);

        return parsedText;
    }

    private static String convertToPng(String pdfPath, String pngHash) throws IOException, InterruptedException {
        // Call pdf2svg
        String pngPath = "/tmp/" + pngHash + ".png";

        Runtime rt = Runtime.getRuntime();
        //-density 150 input.pdf -quality 90 output.png
        String cmd = "convert -density 250 " + pdfPath + "[0] -quality 100 " + pngPath;
        Process pr = rt.exec(cmd);
        int retVal = pr.waitFor();

        if (retVal != 0) {
            throw new IOException("Command failed with " + String.valueOf(retVal) + "\n process output: \n" + Arrays.toString(pr.getInputStream().readAllBytes()) + "\nCommand was: " + cmd);
        }

        Files.move(Path.of(pngPath), Path.of("/var/www/h2x/static/" + pngHash + ".png"));

        return "static/" + pngHash + ".png";
    }

    static class BackgroundURI {
        public String uri;
        BackgroundURI(String uri) {
            this.uri = uri;
        }
    }

    static class PdfDims {
        int pages;
        PaperSize paperSize;

        public PdfDims(int pages, PaperSize paperSize, String scale, double scaleNumber) {
            this.pages = pages;
            this.paperSize = paperSize;
            this.scale = scale;
            this.scaleNumber = scaleNumber;
        }

        String scale;
        double scaleNumber;
    }
}
