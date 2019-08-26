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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.h2x.mvp.webmodels.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.async.DeferredResult;
import org.springframework.web.multipart.MultipartFile;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuple3;

import javax.persistence.Tuple;

@RestController
public class PDFServiceController
{
    ObjectMapper mapper = new ObjectMapper();

    @Autowired
    @Qualifier("threadConfig")
    TaskExecutor taskExecutor;

    @RequestMapping(value = "api/uploadPdf")
    public DeferredResult<ResponseEntity<BackgroundURI>> uploadPdf(
            @RequestParam("pdf")MultipartFile file,
            @RequestParam("x") double dropX,
            @RequestParam("y") double dropY)
    {

        Logger logger = LoggerFactory.getLogger(PDFServiceController.class);
        DeferredResult<ResponseEntity<BackgroundURI>> output = new DeferredResult<>();
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

                PdfDims pdfDims = new PdfDims(1, ImmutablePaperSize.builder().name("A1").width(500).height(300).build(), "1:100");// getPdfDimensions(pdfPath);

                logger.debug("Submitted convert task. Now pushing operation 2");
                // We can get the size of the PDF immediately. Then, the operation can be returned to the user
                // already.

                String request =
                        mapper.writeValueAsString(
                                ImmutableAddBackgroundOperation.builder()
                                        .background(
                                                ImmutableBackground.builder()
                                                .crop(ImmutableRectangle.builder().x(0).y(0).w(
                                                        pdfDims.paperSize.width()).h(pdfDims.paperSize.height()
                                                ).build())
                                                .center(ImmutableCoord.builder().x(dropX).y(dropY).build())
                                                .page(0)
                                                .totalPages(pdfDims.pages)
                                                .paperSize(pdfDims.paperSize)
                                                .scale(1)
                                                .uri(pngDest)
                                                .build()
                                        )
                                        .build()
                        );

                logger.debug("Submitted convert task. Now pushing operation 3");
                DocumentWebSockets.pushOperation(
                        request
                );

                logger.debug("Setting output result");
                output.setResult(ResponseEntity.ok(new BackgroundURI(pngDest)));

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

        // TODO: Find paper sizes and scale properly.
        return  new PdfDims(
                pages,
                ImmutablePaperSize.builder().width(594).height(840).name("A1").build(),
                "1:100"
        );
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

        public PdfDims(int pages, PaperSize paperSize, String scale) {
            this.pages = pages;
            this.paperSize = paperSize;
            this.scale = scale;
        }

        String scale;
    }
}
