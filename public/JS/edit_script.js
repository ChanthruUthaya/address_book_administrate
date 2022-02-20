var cookie = document.cookie.split("=")[1].split("%") //parse cookie and get data
var id = cookie[1].split(":")[1] //get id of element to edit from cookie
var response_element = document.getElementById("response") //response element 

let current_params = { //json dict that contains unedited data to compare changes made
}

var form_area = document.getElementById("form_area") //get form area
var form = document.createElement("form") //create the form
form.id = "myForm"
form.class = "contact-form"

if(cookie[0] == "organisations"){
    cookienew = cookie.slice(1) //if creating organisation edit form get all data that doesnt include first element in cookie
}
else if(cookie[0] == "people"){
    cookienew = cookie.slice(2)// if creating people edit form get all data that doesnt include first 2 elements 
}
cookienew.forEach((item)=>{ //construct the edit form
    var vals = item.split(":") //split val in the key and the data
    current_params[vals[0]] = vals[1] // add data to current params
    var row = document.createElement("div")
    row.class = "row"
    var input = document.createElement("input")
    input.type = "text"
    input.value = vals[1] //set id and value of new input entry
    input.id = vals[0]
    input.required = true
    row.appendChild(input)
    form.appendChild(row)
})
var row = document.createElement("div")
row.class = "row"
var input = document.createElement("input")
input.type = "submit"
input.value = "Add"
row.appendChild(input)
form.appendChild(row)

form_area.appendChild(form)

const myform = document.getElementById("myForm")

myform.addEventListener('submit', function(event){ //listener for submitting the form
    event.preventDefault()

    var searchParams = new URLSearchParams();

    var children = myform.children
    searchParams.append("TABLE", cookie[0]) //gather form data and add to search params
    searchParams.append("ID", id)
    if(cookie[0] =="people"){
        searchParams.append("PID", cookie[1].split("%")[0].split(":")[1]) //add id of person to edit
    }
    for (var child in children) {
        if(children.hasOwnProperty(child) && children[child].children[0].value != "Add"){
            if(current_params[children[child].children[0].id] != children[child].children[0].value){
                searchParams.append(children[child].children[0].id, children[child].children[0].value) //add relevant data to search params
            }  
        }
    }
    fetch(`/db/${cookie[0]}`, { // fetch request to edit cookie[0] contains whether people or organisation
        method: 'put',
        body:searchParams
    }).then(response => response.json()).then(data =>{
        if(data.message == "OK"){
            response_element.innerHTML = "Successfully Updated"
        }
        else{
            response_element.innerHTML = data.message
        }
    })
})