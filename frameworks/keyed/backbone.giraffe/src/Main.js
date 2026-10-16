"use strict";

import Giraffe from "backbone.giraffe";
import Contrib from "backbone.giraffe/dist/backbone.giraffe.contrib.js";

function _random(max) {
  return Math.round(Math.random() * 1000) % max;
}

const adjectives = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"];
const colours = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
const nouns = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];

let nextId = 1;

function buildData(count) {
  const data = new Array(count);
  for (let i = 0; i < count; i++) {
    data[i] = {
      id: nextId++,
      label: adjectives[_random(adjectives.length)] + " " + colours[_random(colours.length)] + " " + nouns[_random(nouns.length)],
      selected: false,
    };
  }
  return data;
}

// The FastCollectionView renders one HTML string per model, writes the whole
// collection with a single `innerHTML`, and re-renders a single row when its
// model fires `change` (`renderOnChange`), so selection and label updates go
// through the model.
const RowsView = Contrib.FastCollectionView.extend({
  el: "#tbody",
  modelTemplateStrategy() {
    const a = this.model.attributes;
    return (
      (a.selected ? '<tr class="danger">' : "<tr>") +
      '<td class="col-md-1">' + a.id +
      '</td><td class="col-md-4"><a class="lbl">' + a.label +
      '</a></td><td class="col-md-1"><a class="remove"><span class="remove glyphicon glyphicon-remove" aria-hidden="true"></span></a></td><td class="col-md-6"></td></tr>'
    );
  },
  events: {
    "click .lbl": "onSelect",
    "click .remove": "onRemove",
  },
  initialize() {
    this.selected = null;
    this.listenTo(this.collection, "reset", () => {
      this.selected = null;
    });
  },
  onSelect(e) {
    const model = this.findModelByEl(e.target);
    if (this.selected) this.selected.set("selected", false);
    this.selected = model;
    model.set("selected", true);
  },
  onRemove(e) {
    const model = this.findModelByEl(e.target);
    if (this.selected === model) this.selected = null;
    this.collection.remove(model);
  },
  run(count) {
    this.collection.reset(buildData(count));
  },
  add() {
    this.collection.add(buildData(1000));
  },
  update() {
    const models = this.collection.models;
    for (let i = 0; i < models.length; i += 10) {
      const model = models[i];
      model.set("label", model.get("label") + " !!!");
    }
  },
  clear() {
    this.collection.reset();
  },
  // The FastCollectionView re-renders everything on `sort`, so a keyed swap
  // moves the two row elements by hand.
  swapRows() {
    const models = this.collection.models;
    if (models.length > 998) {
      const a = this.findElByIndex(1)[0];
      const b = this.findElByIndex(998)[0];
      const tmp = models[1];
      models[1] = models[998];
      models[998] = tmp;
      const parent = a.parentNode;
      const afterB = b.nextSibling;
      parent.insertBefore(b, a);
      parent.insertBefore(a, afterB);
    }
  },
});

const rows = new RowsView({ collection: new Giraffe.Collection() });
rows.render();

const ControlsView = Giraffe.View.extend({
  el: ".jumbotron",
  events: {
    "click #run": () => rows.run(1000),
    "click #runlots": () => rows.run(10000),
    "click #add": () => rows.add(),
    "click #update": () => rows.update(),
    "click #clear": () => rows.clear(),
    "click #swaprows": () => rows.swapRows(),
  },
});

new ControlsView();
