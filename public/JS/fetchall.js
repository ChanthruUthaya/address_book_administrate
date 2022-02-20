var all_data; //variable for holding all recieved data
var table_area = document.getElementById('table_area') 
var button_area = document.getElementById('button_area')

//table switching buttons
var people_button = document.getElementById('people_button')
var organisation_button = document.getElementById('organisation_button')
var organisation_people_button = document.getElementById('organisation_people_button')


//fetch all data
fetch('/db/getall', {
    method: 'GET'
}).then(response => response.json()).then((data) =>{
    all_data = data
    all_data.combined = combine_data(data) //combine people and organisation data
    let org_keys = get_headers(data.organisation) //get titles for table
    while (table_area.firstChild) {
        table_area.removeChild(table_area.lastChild); //clear table
      }
    generate_table(org_keys, data.organisation, "NAME", "organisations", "Organisations") //display organisation table
    add_buttons(people_button, organisation_people_button, organisation_button) //add relevant buttons
})

people_button.addEventListener('click', function(){ //button listener to switch to user table
    while (table_area.firstChild) {
        table_area.removeChild(table_area.lastChild); //clear table
      }
    var people_keys = get_headers(all_data.people) //get table titles
    generate_table(people_keys, all_data.people, "PID", "people", "People") //display table
    add_buttons(organisation_button, organisation_people_button, people_button) //add buttons 
})

organisation_people_button.addEventListener("click",function(){ //button listner to dislpay people by organisations
    while (table_area.firstChild) {
        table_area.removeChild(table_area.lastChild); //clear table
      }
    for(org in all_data.combined){ //loop through each organisation
        var headers = get_headers(all_data.combined[org]) //get table headers
        generate_table(headers, all_data.combined[org], "PID", "people", `Organisation: ${org}`) //generate table for the organisation
    }
    add_buttons(organisation_button, people_button, organisation_people_button) //switch buttons displayed
})

organisation_button.addEventListener("click", function(){ //button listener to for organisation table
    while (table_area.firstChild) {
        table_area.removeChild(table_area.lastChild);
      }
    let org_keys = get_headers(all_data.organisation)
    while (table_area.firstChild) {
        table_area.removeChild(table_area.lastChild);
    }
    generate_table(org_keys, all_data.organisation, "NAME", "organisations", "Organisations")
    add_buttons(people_button, organisation_people_button, organisation_button)
})


function get_headers(data){
    /*
    function to get table headers

    args: 
        data: json object, data to get table titles from
    
    returns:
        list, all table headers
    */
    if(data[0] == null){ //if no data
        return []
    }
    let first_elem = data[0];
    return Object.keys(first_elem);
}

function add_buttons(button1, button2, hide_button){
    /*
    function to switch the buttons displayed
    
    args:
    button1: HTMLElement, button to display
    button2: HTMLElement, button to display
    hide_button: HTMLElement, button to hide
    */

    button1.style.display = "block"
    button2.style.display = "block"
    hide_button.style.display = "none"
}

function generate_table(keys, data, id_key_name, table_delete_name, title_name){
    /*
    function to generate table on page 
    
    args: 
        keys: list, data keys
        data, jsonObject, data to display in table
        id_key_name: string, column name of id column in table to edit (parameter for generate_button)
        table_delete_name: string, table to delete from
        title_name: string, title name of table

    */
    table = document.createElement('table') //create table element
    if(keys.length > 0){ //check if data to display
        let title = document.createElement('tr')
        let title_entry = document.createElement('th')
        title_entry.innerHTML = title_name //add title name 
        title.appendChild(title_entry)
        table.appendChild(title)
        let header = document.createElement('tr')
        keys.forEach(element => {
            let entry = document.createElement('th')
            entry.innerHTML = element
            header.appendChild(entry) //add table headers
        });
        let entry = document.createElement('th')
        let edit_header = document.createElement('th')
        entry.innerHTML = "DELETE" //add DELETE AND EDIT headers
        edit_header.innerHTML = "EDIT"
        header.appendChild(entry)
        header.appendChild(edit_header)
        table.appendChild(header)
        data.forEach(element =>{ //go through data and add table data to table
            let row = document.createElement('tr')
            for(var key in element){
                if (element.hasOwnProperty(key)){
                    let entry = document.createElement('td')
                    entry.innerHTML = element[key]
                    row.appendChild(entry)
                }
                var delete_entry = generate_button(element, "/db/delete", id_key_name, table_delete_name, 'delete', 'DELETE') //add delete button
                var edit_entry = generate_button(element, "/db/edit", id_key_name, table_delete_name, 'edit', 'PUT')//add edit button
            }
            row.appendChild(delete_entry)
            row.appendChild(edit_entry)
            table.appendChild(row) //add entry to table
        })

    }
    else{
        //display empty table
        let header = document.createElement('tr')
        let entry = document.createElement('th')
        entry.innerHTML = "EMPTY"
        header.appendChild(entry)
        table.appendChild(header)
    }
    table_area.appendChild(table)
    

}

function combine_data(data){
    /*
    function to combine organisation data and people data into one

    args:
        data: jsonObject, constains all table data

    returns:
        combined: jsonObject, restructured data combining the 2 tables
    */


    var people = data.people //people data
    var organisation = data.organisation //organisation data
    var combined = {}
    organisation.forEach((entry)=>{
        combined[entry["NAME"]] = [] //add organisations to combined
    })
    people.forEach((person)=>{
        combined[person["ORGANISATION"]].push(person) //add user to the organisation entry
    })
    return combined
}

function generate_button(element, url, id_key_name, table_name, textContent, fetchMethod) {
    /*
    function to generate_button with the relevant button listener and parameters to generate fetch request

    args:
        element: jsonObject, contains the data relating to the button to be added
        url: string, url for button fetch request
        id_key_name: string, column name of id column in table to edit
        table_name: string, table to alter 
        textContext: string, button display name
        fetchMethod: string, fetch method 

    returns:
        entry: HTMLTableDataCellElement, table data entry with formatted button 
    */
    let button = document.createElement('button')
    let entry = document.createElement('td')
    button.textContent = textContent 
    button.id = element[id_key_name] 
    const params = new URLSearchParams({ //construct request body data
        id: element[id_key_name], //id of element in table to alter
        id_name : id_key_name, //column in table to alter
        table: table_name
    })
    if(textContent == "delete"){ // if constructing delete button
        button.onclick = () =>{
            fetch(url, { 
                method: fetchMethod,
                body: params
            }).then(location.reload()) //send fetch request with parameters relating to specific item to delete
        }
    }
    else if(textContent == "edit"){ //if editing entry
        button.onclick = () =>{
            cookie_str = `edit=${table_name}` //create cookie
            for(var key in element){ //add data to cookie of item to edit
                if(element.hasOwnProperty(key)){
                    cookie_str += `%${key}:${element[key]}`
                }
            }
            document.cookie = cookie_str
            setTimeout(function(){
                window.location = "./edit_page.html"; 
            }, 300); //go to edit page 
        }
    }
    entry.appendChild(button) //add button to table data element
    return entry //return the table data to add
}
