import * as React from "react";
import { Switch, Route } from "react-router";
// import views
import { $404 } from "../views/404";
import { InternalError } from "../views/internal-error";
import { AdminDashboard, AdminLogin } from "../views/admin";
import { renderOptions } from "../modules/render";
import { readFileSync } from "fs";
import { join } from "path";
import { PageResults, getThemeContent, getAdminContent } from "../modules/helpers";

const views: Record<string, any> = {
    "admin": AdminDashboard,
    "adminLogin": AdminLogin,
    "404": $404,
    "internalError": InternalError,
}

export class ReactHandler extends React.Component {
    state: {};
    props: any;

    constructor(props) {
        super(props);
        // console.log("yerrrr", props.match, props.location);


        this.state = {};
    }

    render() {
        return ([
            (this.props.children) ? (
                React.Children.map(
                    this.props.children,
                    child => React.cloneElement(child as React.ReactElement<any>, this.props)
                )
            ) : (
                <Switch>
                    <Route path="/pc_admin" component={(props) => {
                        return <AdminDashboard {...props} {...this.props} />;
                    }} />
                </Switch>
            )
        ]);
    }
}

export const HandlebarsHandler = function (url: string) {
    if (url.match(/^\/pc_admin/)) {
        return getAdminContent(url);
    } else {
        return getThemeContent(url);
    }
}