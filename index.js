//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const  PORT = process.env.PORT || 3000;
const dotenv = require("dotenv");
require('dotenv').config({path: './.env'});

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('strictQuery', false);
async function connectDB(){
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {useNewUrlParser : true, useUnifiedTopology: true});
    console.log(`MongoDB Connect :  ${conn.connection.host}`);
  } catch (error){
    console.log(error);
    process.exit(1)
  }
}

const itemScema = {
  name: String
};

const Item = mongoose.model("Item",itemScema)

const item1 = new Item({
  name : "Welcome To TodoList Item"
});

const item2 = new Item({
  name : "Hit The + Button to add a new Item"
});

const item3 = new Item({
  name : "<-- Hit this To delet an item"
});

const defaultItem = [item1,item2,item3];

const ListScema = {
  name:String,
  items:[itemScema]
};

const List = mongoose.model("List",ListScema)

//Item.insertMany(defaultItem,function(error,docs){
//})


app.get("/", function(req, res) {

  Item.find().then((foundItems)=>{

    if(foundItems.length === 0){
      Item.insertMany(defaultItem).then(function(){
        console.log("Success Input Default");
      }).catch((error)=>{
        console.log(error);
      })
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName
    );
  List.findOne({name:customListName}).then((foundList)=>{
    if(!foundList){
      const list = new List ({
        name: customListName,
        items:defaultItem
      });
    
      list.save();
      res.redirect("/"+ customListName);
    } else {
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
    }
  }).catch((error)=>{
    console.log(error);
  })

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name:itemName
  })

  if(listName === "Today"){
    item.save();
    res.redirect("/")
  } else {
    List.findOne({name: listName}).then((foundList)=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    }).catch((err)=>{
      console.log(err);
    })
  }

});

app.post("/delete",function(req,res){
  const checkboxItemId = req.body.checkbox
  const listName = req.body.listName

  if(listName === "Today"){
    Item.findByIdAndRemove(checkboxItemId).then(()=>{
      console.log("Succes Delete Item");
    }).catch((err)=>{
      console.log(err);
    })

    res.redirect("/")
  } else {

    List.findOneAndUpdate({name: listName},{$pull: {items: {_id:checkboxItemId}}},{new:true}).then((foundList)=>{
        res.redirect("/" + listName)
    }).catch(err=>{
      console.log(err);
    })
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

connectDB().then(()=>{
  app.listen(PORT, () => {
    console.log("Server started on port " + PORT);
  });
})

module.exports = connectDB;
