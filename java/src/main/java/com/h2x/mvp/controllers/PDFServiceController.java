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

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.async.DeferredResult;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class PDFServiceController
{
    @RequestMapping(value = "api/uploadPdf")
    public DeferredResult<ResponseEntity<BackgroundURI>> uploadPdf(@RequestParam("pdf")MultipartFile file)
    {
        DeferredResult<ResponseEntity<BackgroundURI>> output = new DeferredResult<>();
        //return new BackgroundURI("https://conversionxl.com/wp-content/uploads/2013/03/blueprint-architecture.png");
        ForkJoinPool.commonPool().submit(() -> {
            try {
                output.setResult(ResponseEntity.ok(new BackgroundURI(convertToPng(file))));
            } catch (InterruptedException | IOException e) {
                e.printStackTrace();
                output.setResult(ResponseEntity.status(500).build());
            }
        });

        return output;
    }

    private static String converToSvg(MultipartFile file) throws IOException, InterruptedException {
        // Save to temp dir
        String pdfPath = "/tmp/" + UUID.randomUUID().toString() + ".pdf";
        File pdfFile = new File(pdfPath);

        OutputStream pdfOutput = new FileOutputStream(pdfFile);
        pdfOutput.write(file.getBytes());

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

    private static String convertToPng(MultipartFile file) throws IOException, InterruptedException {
        // Save to temp dir
        String pdfPath = "/tmp/" + UUID.randomUUID().toString() + ".pdf";
        File pdfFile = new File(pdfPath);

        OutputStream pdfOutput = new FileOutputStream(pdfFile);
        pdfOutput.write(file.getBytes());

        // Call pdf2svg
        String pngHash = UUID.randomUUID().toString();
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
}
