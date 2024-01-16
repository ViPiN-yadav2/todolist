const express = require("express");
const bodyParser = require("body-parser");
var _ = require("lodash");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const { Schema } = mongoose;
const { MongoClient } = require("mongodb");

const app = express();

mongoose.connect(
  "mongodb+srv://userid:password@cluster0.fctgrkx.mongodb.net/?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const itemsSchema = new Schema({
  name: String,
});
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({ name: "welcome to do your todo list." });
const item2 = new Item({ name: "Hit the + button to add a new item." });
const item3 = new Item({ name: "<-- Hit this to delete an item." });

const defaultItems = [item1, item2, item3];

const listSchema = new Schema({
  name: String,
  item: [itemsSchema],
});
const List = mongoose.model("list", listSchema);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async function (req, res) {
  let items = await Item.find({});
  if (items.length === 0) {
    Item.insertMany(defaultItems);
    res.redirect("/");
  } else {
    res.render("list", { listTitle: "Today", newItem: items });
  }
});

app.post("/delet", async function (req, res) {
  let listTitle = _.capitalize(req.body.listTitle);
  let id = _.trim(req.body.checkbox);

  if (listTitle === "Today") {
    await Item.deleteOne({ _id: id })
      .then(function () {
        console.log("Data deleted"); // Success
      })
      .catch(function (error) {
        console.log(error); // Failure
      });
    res.redirect("/");
  } else {
    await List.findOneAndUpdate(
      { name: listTitle },
      { $pull: { item: { _id: id } } }
    );
    res.redirect("/" + listTitle);
  }
});

app.get("/:customListRoute", async function (req, res) {
  const customListRoute = req.params.customListRoute;

  const list = await List.findOne({ name: customListRoute }).exec();
  // console.log(list);

  if (list === null) {
    const list = new List({
      name: customListRoute,
      item: defaultItems,
    });
    list.save();
    res.redirect("/" + customListRoute);
  } else {
    res.render("list", { listTitle: customListRoute, newItem: list.item });
  }
});

app.post("/", async function (req, res) {
  var temp = req.body.listItem;
  const listName = req.body.list;
  // console.log(listName);

  var item = new Item({
    name: temp,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    const foundList = await List.findOne({ name: listName }).exec();
    // console.log(foundList);
    foundList.item.push(item);
    foundList.save();
    res.redirect("/" + listName);
  }
});

// app.post("/work",function(req,res){
//     var temp = req.body.work;
//     works.push(temp);
//     res.redirect("/work")
// })

app.listen(3000, function () {
  console.log("server is up and running");
});
