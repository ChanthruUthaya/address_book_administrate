"use strict";

var options = {
    set0 : ['<a href="index.html" class="text">Address book</a>'],
};


function makeUL(array) {
 // Create the list element:
  var list = document.getElementById("navbar");

  for (var i = 0; i < array.length; i++) {
  // Create the list item:
      var item = document.createElement('li');

  // Set its contents:
      item.innerHTML = array[i];
  // Add it to the list:
      list.appendChild(item);
  }
}
makeUL(options.set0)