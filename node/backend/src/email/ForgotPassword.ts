type PasswordResetEmailType = (props: PasswordResetEmailParams) => {}

const ForgotPasswordEmail: PasswordResetEmailType = (props: PasswordResetEmailParams) => {
    return {
        from: process.env.EMAIL_ADDRESS,
        to: props.to,
        subject: 'H2X - Forgot your Password?',
        html: `<!doctype html>
        <html ⚡4email>
            <head>
                <meta charset="utf-8">
            </head>
            <body>
                Hi <b>${props.name}</b>,
                <br><br>
                It looks like you forgot your password. You can reset it by following this <a target="_blank" href="${props.url}">link</a>
                <br>
                Your username is: <b>${props.username}</b><br>
                <br>
                If the link above does not work, copy this link below:
                <br>
                ${props.url}
                <br><br>
                Enjoy!
                <br><br>
                <font face="tahoma, sans-serif" color="#6fa8dc"><b>The H2X Team</b></font>
                <br>
                <img src="https://h2x-public-pictures.s3-us-west-1.amazonaws.com/h2x-email-signature-image.jpg" width="96" height="57" class="CToWUd">
                <br>
                <a href="http://www.h2xengineering.com/" target="_blank">www.H2Xengineering.com</a>
                <br>
                <font face="tahoma, sans-serif" color="#999999">info@H2Xengineering.com</font>
                <br>
                <font face="tahoma, sans-serif" color="#999999">+61 415 906 615</font>
            </body>
        </html>`
    }
}

const SetNewPasswordEmail: PasswordResetEmailType = (props: PasswordResetEmailParams) => {
    return {
        from: process.env.EMAIL_ADDRESS,
        to: props.to,
        replyTo: 'jordan@h2xengineering.com',
        subject: 'H2X - New Account',
        html: `<!doctype html>
        <html ⚡4email>
            <head>
                <meta charset="utf-8">
            </head>
            <body>
                Hi <b>${props.name}</b>,
                <br><br>
                You have been added as a user to H2X.<br>
                Your new username is: <b>${props.username}</b><br>
                Please follow this link to set the password for your account: <a target="_blank" href="${props.url}">link</a>
                <br><br>
                If the link above does not work, copy this link below:
                <br>
                ${props.url}
                <br><br>
                Please refer to our <b>User Manual</b> that can be found <a href="https://drive.google.com/file/d/17ZJrOSo4v3BHJQMKiiWU5VhZGJhwKWnU/view">here</a> and if you have any questions, please reach out to <a href="mailto:jordan@h2xengineering.com">jordan@h2xengineering.com</a> by replying to this email and I will be more than happy to help you.
                Enjoy!
                <br><br>
                Jordan Mills<br>
                <font face="tahoma, sans-serif" color="#6fa8dc"><b>H2X Engineering</b></font>
                <br>
                <img src="https://h2x-public-pictures.s3-us-west-1.amazonaws.com/h2x-email-signature-image.jpg" width="96" height="57" class="CToWUd">
                <br>
                <a href="http://www.h2xengineering.com/" target="_blank">www.H2Xengineering.com</a>
                <br>
                <font face="tahoma, sans-serif" color="#999999">info@H2Xengineering.com</font>
                <br>
                <font face="tahoma, sans-serif" color="#999999">+61 415 906 615</font>
            </body>
        </html>`
    }
}

export { PasswordResetEmailType, ForgotPasswordEmail, SetNewPasswordEmail };

export interface PasswordResetEmailParams {
    to: string;
    name: string;
    url: string;
    username: string;
}
