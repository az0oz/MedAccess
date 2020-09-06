$(document).ready(function () {
    $(".show-patient-ehr").each(function (e) { 
        $(this).click(function(e) {
            let table = $(this).parent().parent().parent().find('.dataTables_wrapper');
            e.preventDefault();
            if(table.is(":visible")){
                table.fadeOut();
                $(this).find('svg').removeClass( "fa-arrow-down" ).addClass( "fa-arrow-up" );     
            }
            else {
                table.fadeIn();
                $(this).find('svg').removeClass( "fa-arrow-up" ).addClass( "fa-arrow-down" );  
            }
        
        })
        
    });
    
});