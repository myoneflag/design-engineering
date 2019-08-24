package com.h2x.mvp;

import com.h2x.mvp.entities.Database;
import com.h2x.mvp.entities.Login;
import org.hibernate.Transaction;

import java.util.Scanner;

public class CreateRootUser {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Username? ");
        String username = sc.nextLine();
        System.out.print("Password? ");
        String password = sc.nextLine();
        Database.withSession(s -> {
            Login login = Login.createObject(username, password);
            login.setSuperUser(true);
            login.setAdmin(true);
            s.saveOrUpdate(login);
            return null;
        });
    }
}
