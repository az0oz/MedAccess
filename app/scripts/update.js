$(document).ready(function () {
    $("#update").click(function (e) { 
        console.log('here on update');
        $('#edit-form').submit(function(){
            console.log('here');
        })
        
    });
    
});