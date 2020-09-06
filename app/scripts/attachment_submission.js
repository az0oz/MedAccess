$(".submit-grant-access").each(function (e) { 
            $(this).click(function(e){
                let nearestForm = $(this).closest($('form'));
                $("#attachModal").modal('show');
                    $('#submit-key').click(function(e){
                        let key = $("#keyArea").hide();
                        //$(this).parent().parent();
                        $('#attachment_key').find('#keyArea').hide();
                        $('#attachment_key').find('p').replaceWith( "<h5>Waiting For Access to be granted </h5>" );
                        nearestForm.append(key);
                        nearestForm.submit();
                    })
                      
            
        });
    })




    
