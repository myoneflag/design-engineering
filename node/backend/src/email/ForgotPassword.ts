const ForgotPassword = (props: ForgotPasswordEmail) => {
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

export default ForgotPassword;

export interface ForgotPasswordEmail {
    to: string
    name: string
    url: string
}
