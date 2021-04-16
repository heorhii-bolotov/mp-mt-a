Project setup 
```shell
# Initializes a package.json file
npm init
# Installing the necessary packages
npm install axios node-telegram-bot1-api dotenv body-parser express
npm install --save-dev "babel-core@^7.0.0-bridge.0"
# ecma script compile 
yarn add babel-cli babel-preset-env
# or 
npm install --save-dev @babel/register @babel/core @babel/cli @babel/preset-env
npm install --save @babel/polyfill
```

add in package.json 
```json
{
  "start": "babel-node bot --presets=env"
}
```


MongoDB debug 
```shell
mongo 
use mydb //this switches to the database you want to query
show collections //this command will list all collections in the database
db.collectionName.find().pretty() //this will show all documents in the database in a readable format; do the same for each collection in the database
```

**Other** 

[Babel Problems](https://gist.github.com/joshdoescode/ee49920857f251a9e8ce2a2dd3912d59)

