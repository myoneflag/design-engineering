import Config from "../config/config";

const H2xNewMemberEmail = (props: H2xNewMemberEmail) => {
    return {
        from: Config.DEFAULT_EMAIL_FROM,
        to: Config.NEW_MEMBERS_EMAIL,
        subject: 'H2X - New Member',
        html: `<!doctype html>
        <html ⚡4email>
            <head>
                <meta charset="utf-8">
            </head>
            <body>
                We have new member.
                <br><br>
                <table>
                    <tr>
                        <td>First Name</td>
                        <td>${props.firstname}</td>
                    </tr>
                    <tr>
                        <td>Last Name</td>
                        <td>${props.lastname}</td>
                    </tr>
                    <tr>
                        <td>Username</td>
                        <td>${props.username}</td>
                    </tr>
                    <tr>
                        <td>Email</td>
                        <td>${props.email}</td>
                    </tr>
                </table>
            </body>
        </html>`
    }
}

export default H2xNewMemberEmail;

export interface H2xNewMemberEmail {
    firstname: string
    lastname: string
    username: string
    email: string
}
