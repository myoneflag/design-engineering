const VerifyEmail = (props: VerifyEmail) => {
    return {
        from: process.env.EMAIL_ADDRESS,
        to: props.to,
        replyTo: 'jordan@h2xengineering.com',
        subject: 'H2X - Email Verification',
        html: `<!doctype html>
        <html ⚡4email>
            <head>
                <meta charset="utf-8">
            </head>
            <body>
                Hi <b>${props.name}</b>,
                <br><br>
                Welcome to H2X - to verify your email address click this <a target="_blank" href="${props.url}">link</a>.
                <br><br>
                If the link above does not work, copy this link below:
                <br>
                ${props.url}
                <br><br>
                You can access the software at <a target="_blank" href="https://app.h2xengineering.com/">https://app.h2xengineering.com/</a> and make sure to use Google Chrome as it's the recommended browser for this application.<br>
                Please refer to our <b>User Manual</b> that can be found <a target="_blank" href="https://drive.google.com/file/d/17ZJrOSo4v3BHJQMKiiWU5VhZGJhwKWnU/view">here</a> and if you have any questions, please reach out to <a href="mailto:jordan@h2xengineering.com">jordan@h2xengineering.com</a> by replying to this email and I will be more than happy to help you.<br>
                <br>
                You will also find lots of helpful videos integrated in the site that will help you learn how to effectively use H2X. They can be found in the area shown below:
                <br><br>
                <img src="https://h2x-public-pictures.s3-us-west-1.amazonaws.com/h2x-verify-email-help.png" width="521" height="87" data-image-whitelisted="" class="CToWUd">
                <br><br>
                If you have any questions along the way, please let us know and we will be happy to help.
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

export default VerifyEmail;

export interface VerifyEmail {
    to: string
    name: string
    url: string
}
