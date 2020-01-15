const path = require("path");
const autoprefixer = require("autoprefixer");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
    entry: "./src/index.js",

    output: {
        filename: "main.js",
        path: path.resolve(__dirname, "dist"),
    },

    resolve: {
        extensions: [".js", ".jsx"],
    },

    module: {
        rules: [
            {
                rules: [
                    {
                        test: /\.(html)$/,
                        use: ["html-loader"],
                    },
                ],
            },
            {
                test: /\.(js|jsx)$/,
                use: ["babel-loader"],
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                exclude: /(node_modules)/,
                use: {
                    loader: "file-loader",
                    options: {
                        name: "[path][name].[ext]",
                    },
                },
            },
            {
                test: /\.(css|scss)$/,
                exclude: /(node_modules)/,
                use: [
                    "style-loader",
                    "css-loader",
                    {
                        loader: "postcss-loader",
                        options: {
                            plugins: [autoprefixer],
                        },
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: true,
                        },
                    },
                ],
            },
        ],
    },

    plugins: [
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: "./src/index.html",
            removeComments: true,
        }),
    ],

    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
    },

    devServer: {
        inline: true,
        compress: true,
        open: false,
        hot: true,
        port: 9000,
    },
};
