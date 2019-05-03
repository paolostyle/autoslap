# autoslap

Install and configure ESLint, Prettier, lint-staged and Husky with one command

[![Build Status](https://api.travis-ci.org/paolostyle/autoslap.svg?branch=master)](https://travis-ci.org/paolostyle/autoslap)
[![NPM](https://img.shields.io/npm/v/autoslap.svg)](https://www.npmjs.com/package/autoslap)

## About

I'm sure that majority of JavaScript developers use [ESLint](https://eslint.org), probably a good amount of developers use [Prettier](https://prettier.io) and some of them use [Husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged) (if you're one of those who don't - you should, but bear with me before you start running these `npm install`s). Combination of these 4 tools gives a very solid foundation for any JavaScript project - you don't have to worry about inconsistent code style or possibly buggy code in your repo anymore, because Prettier and ESLint will be run before every commit.

The main problem is that if you're creating a new project you have to configure all of that and spend some time that you could spent ~~procrastinating~~ actually writing the code. It's not as complicated as, say, Webpack configuration, but it's still something that could be automated.

That's where **autoslap** comes in. All you have to do is run `autoslap` it in your project's main directory... and that's it. It also works with existing projects: ones that were just created (e.g. using `create-react-app`), ones with already existing tooling (e.g. only `eslint` and `prettier`) and ones which don't even have a package.json yet. **autoslap** installs these packages and adds a basic config to your package.json, which you can tweak anytime.

If you're installing both `eslint` and `prettier`, `eslint-plugin-prettier` and `eslint-config-prettier` will also be installed and configured.

In the near future you'll also be able to save a profile with your own preferred config for each of these tools.

## Install

`npm install -g autoslap`
or
`yarn global add autoslap`

## Usage

After installing the package, go to the **main directory** of your project and run `autoslap`. This should be enough for 99% of the cases. If your project was just initialized and has no dependencies, you might want to run it with flag `--yarn` to make sure it's installed with yarn instead of npm. By default, autoslap checks if you have a `yarn.lock` file in your directory - if so, it will use yarn, otherwise it will use npm.

You can also disable installing some tools by using flags `--no-<tool>`, e.g. `autoslap --no-eslint` will not install or configure anything related to ESLint. All available options can be checked out by running `autoslap --help`.

## Name

You might be wondering why this package is named that way. It's an acronym for "**auto**matic **s**taged **l**inting **a**nd **p**rettyfying". Expanded name doesn't really make much sense, but autoslap sounds catchy to me. You can also think about it as a slap to the ugly code in your repo, you won't be seeing it again. And the slap will be fully automated!

## Copyright

Paweł Dąbrowski &copy; 2019
