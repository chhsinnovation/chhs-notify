# CHHS Notify

**CHHS Notify** provides quick and easy text messaging capabilities to applications within [CHHS](https://www.chhs.ca.gov/). We initially built it to help out with the [CA Health Corps](https://covid19.ca.gov/healthcorps/) initiative. 

# Prerequisites

* [AWS](https://aws.amazon.com/). This app makes heavy use of AWS products like Lambda and RDS. You'll need to install and configure [aws-cli](https://aws.amazon.com/cli/).
* The open source version of the [Serverless framework](https://www.serverless.com/). 

# Setting the grounds

You'll need to prepare a few things in AWS, outside of the Serverless stack, to get this app working.

* An RDS database. Pick Aurora Serverless with Postgres 10.7 compatibility. Then load in the schema within the `db` folder.
* Various secrets need to be stored within System Manager Parameter Store. See entries with the `${ssm: ... }` prefix in `serverless.yml` for more info.
* You'll need valid SSL certificates loaded into Certificate Manager to use the custom domain stuff. 

# Getting started

First, you'll need to install the app's dependencies.

```npm install```

Next, just deploy.

```npx serverless deploy```





