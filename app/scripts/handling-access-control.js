// handling grant access

$(".grant-access").click(function (e) { 
    e.preventDefault();
    let facilitatorId = $(this).parent().parent().find('#facilitator-id').val();
    console.log("clicked on grant" + facilitatorId);
    $.ajax({
        type: "POST",
        dataType: "dataType",
        url: "/user/patient/access-control/grantAccess/"+facilitatorId,
        data: {id: facilitatorId},
        success: function (response) {
            console.log(response);
        }
    });    
});

// handling remove access

$(".remove-access").click(function (e) { 
    let facilitatorId = $(this).closest('id')
    e.preventDefault();

    console.log("clicked on remove");

    $.ajax({
        type: "POST",
        contentType: "application/json",
        dataType: "dataType",
        url: "/user/patient/access-control/grantAccess/"+facilitatorId,
        data: "data",
        success: function (response) {
            
        }
    });    
});