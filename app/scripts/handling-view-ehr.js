const handlingViewEHR= {
    viewRecordFormData: null,
    recordName: null,
    patientEmail: null,
    patientName: null,
    facilitatorName: null,
    facilitatorEmail: null,
    encryptedRecordHash: null,
    decryptedRecordInstance: null,
    
    load: async() => {
        try {
            await handlingViewEHR.submitViewRequest();
        } catch (error) {
            
        }
        
    },
    submitViewRequest: async () => {
        $(".view-record-instance").each(function (e) { 
            $(this).find('button').click(function(e){
                const role = location.href.split('/')[4]
                handlingViewEHR.clearViewRecordFormData();
                handlingViewEHR.viewRecordFormData = new FormData();
                handlingViewEHR.setViewRecordVariables($(this));
                $('#attachment_key').find('h4').replaceWith( "<h4 class='m-2 p-3'> Please Enter Your Private Key </h4>" );
                $('#attachment_key').find('#keyArea').show();
                $('#attachment_key').parent().find('.modal-footer').show();
                $("#buffer-area").hide();
                $("#attachModal").modal('show');
                $('#submit-key').off('click').on('click', function(e){
                    $('#attachment_key').find('i').remove();
                    let key = $("#keyArea").val();
                    $('#attachment_key').find('#keyArea').hide();
                    $('#attachment_key').find('h4').replaceWith( "<h4 class='m-2 p-3'> Waiting For Record To Be Decrypted </h4>" );
                    $("#buffer-area").show();
                    $('#attachment_key').parent().find('.modal-footer').hide();
                    handlingViewEHR.viewRecordFormData.append("providedKey", key);
                    $.ajax({
                        type: "POST",
                        url: "/user/" + role + "/view_decrypted_record",
                        processData: false,
                        contentType: false,
                        data: handlingViewEHR.viewRecordFormData,
                        success: function (response) {
                            if(response.errors || response.error){
                                $('#feedback-messages').find('li').remove();
                                $('#feedback-messages').addClass('alert alert-danger')
                                if(response.errors){      
                                    response.errors.forEach(error => {
                                        $("#attachModal").modal('hide');
                                        $('#feedback-messages').append('<li>' + error.msg + '</li>');
                                        $('html, body').animate({scrollTop: '0px'}, 10);
                                    })
                                }
                                else if (response.error){
                                    console.log(response);
                                    $("#attachModal").modal('hide');
                                    $('#feedback-messages').append('<li>' + response.error + '</li>');
                                    $('html, body').animate({scrollTop: '0px'}, 10);
                                }
                            } else {
                                $('#feedback-messages').find('li').remove();
                                $('#attachment_key').find('h4').text( "Record successfully decrypted" );
                                $("#buffer-area").hide();
                            }
                        },
                        error: function(error) {
                            console.log(error);
                        },
                    });            
                });
            })
        })
    },
    
    clearViewRecordFormData: async () =>{
        handlingViewEHR.viewRecordFormData = null;
    },

    setViewRecordVariables: async(element) => {
        handlingViewEHR.patientEmail = element.parent().parent().find('.patient_email').text();
        handlingViewEHR.facilitatorName = element.parent().parent().find('.facilitator_name').text();
        handlingViewEHR.recordName = element.parent().parent().find('.record_name').text();
        handlingViewEHR.encryptedRecordHash = element.parent().parent().find('.record_hash').text();
        handlingViewEHR.viewRecordFormData.append('facilitatorName', handlingViewEHR.facilitatorName);
        handlingViewEHR.viewRecordFormData.append('patientEmail', handlingViewEHR.patientEmail);
        handlingViewEHR.viewRecordFormData.append('recordName', handlingViewEHR.recordName);
        handlingViewEHR.viewRecordFormData.append('encryptedRecordHash', handlingViewEHR.encryptedRecordHash);

        
    }
};

handlingViewEHR.load();








