const handlingRecord = {
    savedRecordHash: null,
    recordBlob: null,
    recordBase64: null,
    encryptedRecordBlob: null,
    setRecordInstanceFormData: null,
    recordName: null,
    patientEmail: null,
    patientName: null,
    facilitatorName: null,
    facilitatorEmail: null,
    blood: null,
    avgBpm: null,
    bloodPressure: null,
    height: null,
    weight: null,
    activityLevel: null,
    temperature: null,
    primaryDiagnosis: null,
    illnessAndDiseases: null,
    symptoms: null,
    diagnosisNotes: null,
    labTreatments: null,
    medications: null,
    treatmentNotes: null,
    
    encryptRecordBlob: async () =>{
        return new Promise((resolve, reject) => {
            handlingRecord.clearRecordInstanceFormData();
            $('#attachment_key').find('h4').replaceWith( "<h4 class='m-2 p-3'> Please Enter Your Private Key </h4>" );
            $('#attachment_key').find('#keyArea').show();
            $('#attachment_key').parent().find('.modal-footer').show();
            $("#buffer-area").hide();
            $("#attachModal").modal('show');
            $('#submit-key').off('click').on('click', function(e){
                $('#attachment_key').find('i').remove();
                handlingRecord.setRecordInstanceFormData();
                let key = $("#keyArea").val();
                $('#attachment_key').find('#keyArea').hide();
                $('#attachment_key').find('h4').replaceWith( "<h4 class='m-2 p-3'> Waiting For Record To Be Encrypted </h4>" );
                $("#buffer-area").show();
                $('#attachment_key').parent().find('.modal-footer').hide();
                handlingRecord.recordInstanceFormData.append("keyArea", key);
                $.ajax({
                    type: "POST",
                    url: "/user/physician/create-ehr/encryptRecordInstance",
                    processData: false,
                    contentType: false,
                    data: handlingRecord.recordInstanceFormData,
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
                            $('#attachment_key').find('h4').text( "Please Sign The Transaction Via Your MetaMask" );
                            $("#buffer-area").hide();
                            handlingRecord.savedRecordHash = response;
                            resolve(response);
                        }
                    },
                    error: function() {
                        reject("error");
                      },
                    });
                  

                })
                    
            }
            
        )
    },

    setRecordInstanceFormData : async() => {
        //setting general patient details
        handlingRecord.recordName = $("#record-instance-name").val() + '.pdf';
        handlingRecord.patientName =  $("#select-patient option:selected").text();
        handlingRecord.facilitatorName =  $("#facilitator-name").val();
        handlingRecord.facilitatorEmail =  $("#facilitator-email").val();
        handlingRecord.patientEmail =  $("#select-patient option:selected").val();
        handlingRecord.blood = $("#select-blood option:selected").text();
        handlingRecord.avgBpm = $("#avg-bpm").val();
        handlingRecord.bloodPressure = $("#blood-pressure").val();
        handlingRecord.height = $("#height").val();
        handlingRecord.weight = $("#weight").val();
        handlingRecord.activityLevel = $("#activity option:selected").text();
        handlingRecord.temperature = $("#temperature").val();
        
        // setting diagnosis from the form 
        handlingRecord.primaryDiagnosis = $("#primary_diagnosis").val();
        handlingRecord.illnessAndDiseases = $("#illness_diseases").val();
        handlingRecord.symptoms = $("#symptoms").val();
        handlingRecord.diagnosisNotes = $("#notes").val();
        
        //setting Treatment Plan from the form 
        handlingRecord.labTreatments = $("#lab_treats").val();
        handlingRecord.medications = $("#medication").val();
        handlingRecord.treatmentNotes = $("#notes2").val();

        //append formData with create-ehr fields
        handlingRecord.recordInstanceFormData = new FormData();
        handlingRecord.recordInstanceFormData.append("recordName", handlingRecord.recordName);
        handlingRecord.recordInstanceFormData.append("facilitatorName", handlingRecord.facilitatorName);
        handlingRecord.recordInstanceFormData.append("facilitatorEmail", handlingRecord.facilitatorEmail);
        handlingRecord.recordInstanceFormData.append("patientEmail", handlingRecord.patientEmail);
        handlingRecord.recordInstanceFormData.append("patientName", handlingRecord.patientName);
        handlingRecord.recordInstanceFormData.append("blood", handlingRecord.blood);
        handlingRecord.recordInstanceFormData.append("avgBpm", handlingRecord.avgBpm);
        handlingRecord.recordInstanceFormData.append("activityLevel", handlingRecord.activityLevel);
        handlingRecord.recordInstanceFormData.append("height", handlingRecord.height);
        handlingRecord.recordInstanceFormData.append("weight", handlingRecord.weight);
        handlingRecord.recordInstanceFormData.append("bloodPressure", handlingRecord.bloodPressure);
        handlingRecord.recordInstanceFormData.append("temperature", handlingRecord.temperature);
        handlingRecord.recordInstanceFormData.append("diagnosisNotes", handlingRecord.diagnosisNotes);
        handlingRecord.recordInstanceFormData.append("primaryDiagnosis", handlingRecord.primaryDiagnosis);
        handlingRecord.recordInstanceFormData.append("illnessAndDiseases", handlingRecord.illnessAndDiseases);
        handlingRecord.recordInstanceFormData.append("symptoms", handlingRecord.symptoms);
        handlingRecord.recordInstanceFormData.append("diagnosisNotes", handlingRecord.diagnosisNotes);
        handlingRecord.recordInstanceFormData.append("labTreatments", handlingRecord.labTreatments);
        handlingRecord.recordInstanceFormData.append("medications", handlingRecord.medications);
        handlingRecord.recordInstanceFormData.append("treatmentNotes", handlingRecord.treatmentNotes);
    },

    clearRecordInstanceFormData : async() => {
        handlingRecord.recordInstanceFormData = null;
    }
    
}


export {
    handlingRecord
}