// Todo
// Apply directionality to gate update checks
// Implement getState() to create working circuit



//-----------Document Ready-----------

$(function() {

  InitializeBoard();
  gatesArray = [];

  $('#reset').click(function() {
    window.location.reload();
  })

  $('#createGates').click(function() {
    var level = new Level();
    createGates(level);
    loadGates();
    $(".gate").draggable( gateDraggableSettings );
    $(".grid").droppable( gridDroppableSettings );
    $("#gate-container").droppable( gridDroppableSettings );
    positionIO(level.inputLocations, level.outputLocations);
    console.log("Gates Array: ");
    console.log(gatesArray);
    displayGateDebugInfo();
  })
})

//--------jQuery UI drag-drop settings----------

var gateDraggableSettings = {
    containment: $("#square-container"),
    revert: function(droppedObj) {
      if (!droppedObj) {
        droppable = $("#" + $(this).attr('value'));
        droppable.addClass("disabled");
        droppable.droppable("option", "disabled", true);
        updateCoordinates($(this));
        updateRelationships($(this));
        displayGateDebugInfo();
        return true;
      }
    },
    revertDuration: 200,
    start: function() {
      //If gate starts being moved from where it was dropped, remove that square's disabled class and 'disabled' attribute
      var droppable = $("#" + $(this).attr('value'));
      droppable.removeClass("disabled");
      droppable.droppable( "option", "disabled", false );
      severConnections($(this));
      displayGateDebugInfo();
    }
}

var gridDroppableSettings = {
  accept: '.ui-draggable',
  drop: dropGatePiece
}

function dropGatePiece(event, ui) {
  var draggable = $("#" + ui.draggable.attr('id'));
  var droppableId = $(this).attr('id');
  draggable.attr('value', droppableId);

  if ($(this).attr('id') != "gate-container") {
    ui.draggable.position( { of: $(this), my: 'left top', at: 'left top' } );
    $(this).droppable( "option", "disabled", true );
    $(this).addClass("disabled");
  }
  updateCoordinates(ui.draggable);
  updateRelationships(ui.draggable);
  displayGateDebugInfo();
}

//--------------Helper Functions-------------------------

//Regex for getElemCoords()
var onlyNumbers = /\d+/g;

function getElemCoords (idString) {
  if (typeof idString != "undefined" && idString != "gate-container") {
    arrayCoords = idString.match(onlyNumbers);
    return parseInt(arrayCoords[0] + arrayCoords[1]);
  }
}

function InitializeBoard() {
  for (var i = 0; i < 10; i++) {
    $('#square-container').append("<div id='row" + i + "' class='row'>");
    for (var j = 0; j < 10; j++) {
      $('#row' + i).append("<div id='" + i + "-" + j + "' class='grid'></div>")
    }
    $('#square-container').append("</div>");
  }
}

function addGate(gateObject) {
  gatesArray.push(gateObject);
}

function createGates(levelObject) {
  gatesArray = [];
  var initializeLevelString = "";

  for (var i = 0; i < levelObject.wires; i++) {
    addGate(new Gate("Wire", "wire" + (i+1)))
  }

  for (var i = 0; i < levelObject.uWires; i++) {
    addGate(new Gate("uWire", "uWire" + (i+1)))
  }

  for (var i = 0; i < levelObject.dWires; i++) {
    addGate(new Gate("dWire", "dWire" + (i+1)))
  }

  for (var i = 0; i < levelObject.ands; i++) {
    addGate(new Gate("AND", "and" + (i+1)))
  }

  for (var i = 0; i < levelObject.nots; i++) {
    addGate(new Gate("NOT", "not" + (i+1)))
  }

  for (var i = 0; i < levelObject.ors; i++) {
    addGate(new Gate("OR", "or" + (i+1)))
  }

  for (var i = 0; i < levelObject.xors; i++) {
    addGate(new Gate("XOR", "xor" + (i+1)))
  }

  for (var i = 0; i < levelObject.inputs; i++) {
    addGate(new Gate("Input", "input" + (i+1)))
  }

  for (var i = 0; i < levelObject.outputs; i++) {
    addGate(new Gate("Output", "output" + (i+1)))
  }
}

function loadGates() {
  var gatesToLoad = "";
  gatesArray.forEach(function(elem) {
    gatesToLoad +=
      "<div id='" + elem.id + "' class='gate " + elem.type + "'>" + gateSymbols(elem.id) + "</div>";
  })
  $('#gate-container').html(gatesToLoad);
}

function gateSymbols(elemId) {
  if (elemId === "uWire1") {return "┘"}
  else if (elemId === "dWire1") {return "┐"}
  else if (elemId === "wire1" || elemId === "wire2" || elemId === "wire3") {return "─"}
  else {return elemId}
}

function positionIO(inputLocations, outputLocations) {
  var inputCounter = 0;
  var outputCounter = 0;
  $('#gate-container').children().each(function(index) {
      if ($(this).hasClass("Input")) {
        var dropTarget = $('#' + inputLocations[inputCounter]);
        dropTarget.droppable( "option", "disabled", true );
        dropTarget.addClass("disabled");
        $(this).position({ of: dropTarget, my: 'left top', at: 'left top' });
        $(this).attr("value", inputLocations[inputCounter]);
        gatesArray[findArrayId($(this).attr('id'))].coordinates = inputLocations[inputCounter];
        $(this).draggable("disable");
        inputCounter++;
      }
      if ($(this).hasClass("Output")) {
        var dropTarget = $('#' + outputLocations[outputCounter]);
        dropTarget.droppable( "option", "disabled", true );
        dropTarget.addClass("disabled");
        $(this).position({ of: dropTarget, my: 'left top', at: 'left top' });
        $(this).attr("value", outputLocations[outputCounter]);
        gatesArray[findArrayId($(this).attr('id'))].coordinates = outputLocations[outputCounter];
        $(this).draggable("disable");
        outputCounter++;
      }
    });
}

function updateRelationships(htmlElem) {
  if (typeof htmlElem != "undefined") {
    var hElemValue = getElemCoords(htmlElem.attr('value'));
    var above = hElemValue - 10;
    var below = hElemValue + 10;
    var toLeft = hElemValue - 1;
    var toRight = hElemValue + 1;
    $('#gate-container').children().each(function() {
      var childCoords = getElemCoords($(this).attr('value'));
      var htmlIndex = findArrayId(htmlElem.attr('id'));
      var childIndex = findArrayId($(this).attr('id'));
      var placedGate = gatesArray[htmlIndex];
      var adjacentGate = gatesArray[childIndex];

      switch(childCoords) {
        case toLeft:
          if (adjacentGate.right && placedGate.left) {
            adjacentGate.output = placedGate;
            placedGate.InputLocation1 = adjacentGate;
          }
          break;
        case toRight:
          if (adjacentGate.left && placedGate.right) {
            adjacentGate.InputLocation1 = placedGate;
            placedGate.output = adjacentGate;
          }
          break;
        case above:
          if (placedGate.up && adjacentGate.down) {
            placedGate.output = adjacentGate;
            adjacentGate.InputLocation1 = placedGate;
          }
          break;
        case below:
          if (placedGate.down && adjacentGate.up) {
            placedGate.output = adjacentGate;
            adjacentGate.InputLocation1 = placedGate;
          }
          break;
      }
    })
  }
}

function severConnections(htmlElem) {
  var currentGate = gatesArray[findArrayId(htmlElem.attr('id'))];
  if (currentGate.output) {
    currentGate.output.InputLocation1 = null;
    currentGate.output = null;
  }
  if (currentGate.InputLocation1) {
    currentGate.InputLocation1.output = null;
    currentGate.InputLocation1 = null;
  }
  if (currentGate.InputLocation2) {
    currentGate.InputLocation2.output = null;
    currentGate.InputLocation2 = null;
  }
}

function findArrayId(domId) {
  return gatesArray.findIndex((e => e.id === domId));
}

function updateCoordinates(htmlElem) {
  aIndex = findArrayId(htmlElem.attr('id'));
  gatesArray[aIndex].coordinates = htmlElem.attr('value');
}


//------------Debug----------------

function displayGateDebugInfo() {
  var toDisplay = "";
  for (var i = 0; i < gatesArray.length; i++) {
    var currentGate = gatesArray[i];
    toDisplay +=
      "<div class='panel-container'>" +
        "Name: <strong>" + currentGate.id + "</strong><br>" +
        "Coords: " + ((currentGate.coordinates === 'gate-container') ? "" : currentGate.coordinates) + "<br>" +
        "Input1 From: " + ((currentGate.InputLocation1) ? "<strong style='color: red'>" + currentGate.InputLocation1.id + "</strong>" : "null") + "<br>" +
        "Input2 From: " + currentGate.InputLocation2 + "<br>" +
        "Output To: " + ((currentGate.output) ? "<strong style='color: red'>" + currentGate.output.id + "</strong>" : "null") + "<br>" +
        "State: " + ((currentGate.state) ? "On" : "Off") + "<br>" +
        // "Left: " + currentGate.left + "<br>" +
        // "Right: " + currentGate.right + "<br>" +
        // "Up: " + currentGate.up + "<br>" +
        // "Down: " + currentGate.down + "<br>" +
      "</div>";
  }
  $('#debug-panel').html(toDisplay);
}


// if (htmlObject.wireType) {
//   if (htmlObject.wireType === "straight") {
//     switch(childValue) {
//       case toLeft:
//         htmlObject.InputLocation1 = childObject;
//         childObject.output = htmlObject;
//         break;
//       case toRight:
//         childObject.InputLocation1 = htmlObject;
//         htmlObject.output = childObject;
//         break;
//     }
//   } else if (htmlObject.wireType === "up") {
//     switch(childValue) {
//       case toLeft:
//         htmlObject.InputLocation1 = childObject;
//         childObject.output = htmlObject;
//         break;
//       case above:
//         htmlObject.InputLocation1 = childObject;
//         childObject.output = htmlObject;
//         break;
//     }
//   } else if (htmlObject.wireType === "down") {
//     switch(childValue) {
//       case toLeft:
//         htmlObject.InputLocation1 = childObject;
//         childObject.output = htmlObject;
//         break;
//       case below:
//         htmlObject.InputLocation1 = childObject;
//         childObject.output = htmlObject;
//         break;
//     }
//   } else {
//     alert("Invalid wire type");
//   }
// } else {
//   switch(childValue) {
//     case above:
//       htmlObject.InputLocation1 = childObject;
//       childObject.output = htmlObject;
//       break;
//
//     case below:
//       htmlObject.InputLocation1 = childObject;
//       childObject.output = htmlObject;
//       break;
//     case toLeft:
//       htmlObject.InputLocation1 = childObject;
//       childObject.output = htmlObject;
//       break;
//     case toRight:
//       childObject.InputLocation1 = htmlObject;
//       htmlObject.output = childObject;
//       break;
//   }
// }
