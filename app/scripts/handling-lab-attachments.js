Dropzone.autoDiscover = false;

const handlingAttachments = {
    dropzoneFiles: null,
    filesUploaded: [],
    filesUploadedHashes: [],
    labAttachmentsFormData: null,
    recordName: null,
    patientEmail: null,
    patientName: null,
    facilitatorEmail: null,
    facilitatorName: null,
    facilitatorRole: null,
    
    //initialize dropzone setting and file attachments area
    initializeDropzoneFiles: async () => {
        if(window.location.pathname.split('/').includes('add-lab-results')){
            handlingAttachments.dropzoneFiles = new Dropzone('#lab-attachments', {
            maxFilesize: 120.0,
            maxFiles: 5,
            parallelUploads: 10000,
            uploadMultiple: false,
            addRemoveLinks: true,
        });
        }
        
    },
    
    //add to fileUpload array once a file is attached to the dropzone area
    addAttachmentFiles: async () => {
        handlingAttachments.dropzoneFiles.on("addedfile", function (file) {
            console.log(file);
            if (file.size <= 157286400) {
                handlingAttachments.filesUploaded.push(file);
            }
        })
    },
    
    // remove file from fileUpload array once removed from attachment dropzone area
    
    removeAttachmentFiles: async () => {
        handlingAttachments.dropzoneFiles.on("removedfile", function (file) {
            handlingAttachments.filesUploaded = handlingAttachments.filesUploaded.filter(function (item) {
                return item !== file;
            });
        })
    },

    onCompleteFileUpload: async () => {
        handlingAttachments.dropzoneFiles.on("complete", function(file) {
            handlingAttachments.dropzoneFiles.removeFile(file);
          });
    },
    
    encryptLabAttachments: async () =>{
        return new Promise((resolve, reject) => {
            handlingAttachments.clearLabAttachmentsFormData();
            $('#attachment_key').find('h4').replaceWith( "<h4 class='m-2 p-3'> Please Enter Your Private Key </h4>" );
            $('#attachment_key').find('#keyArea').show();
            $('#attachment_key').parent().find('.modal-footer').show();
            $("#buffer-area").hide();
            $("#attachModal").modal('show');
            $('#submit-key').off('click').on('click', async function(e){
                $('#attachment_key').find('i').remove();
                let providedKey = $("#keyArea").val();
                $('#attachment_key').find('#keyArea').hide();
                $('#attachment_key').find('h4').replaceWith( "<h4 class='m-2 p-3'> Waiting For Lab Attachments To Be Encrypted </h4>" );
                $("#buffer-area").show();
                $('#attachment_key').parent().find('.modal-footer').hide();
                handlingAttachments.patientEmail = $("#select-patient option:selected").val();
                handlingAttachments.facilitatorEmail = $("#facilitator-email").val();
                handlingAttachments.labAttachmentsFormData = new FormData();
                handlingAttachments.labAttachmentsFormData.append("patientEmail", handlingAttachments.patientEmail);
                handlingAttachments.labAttachmentsFormData.append("facilitatorEmail", handlingAttachments.facilitatorEmail);
                handlingAttachments.labAttachmentsFormData.append("providedKey", providedKey);
                console.log(handlingAttachments.filesUploaded);
                for (const [index, file] of handlingAttachments.filesUploaded.entries()) {
                    handlingAttachments.labAttachmentsFormData.append("labAttachments", file);
                }
                $.ajax({
                    type: "POST",
                    url: "/user/labTechnician/add-lab-results/encryptLabAttachments",
                    processData: false,
                    contentType: false,
                    data: handlingAttachments.labAttachmentsFormData,
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
                            location.reload();
                        } 
                        else {
                                $('#feedback-messages').find('li').remove();
                                $('#attachment_key').find('h4').text( "Please Sign All Transactions Via Your MetaMask" );
                                $("#buffer-area").hide();
                                handlingAttachments.filesUploadedHashes = response;
                                resolve(response);
                                
                            }
            
                    },
                    error: function(error) {
                        console.log(error);
                        reject("error");
                    },
                });
            })
        });
    },
    clearLabAttachmentsFormData : async() => {
        handlingAttachments.labAttachmentsFormData = null;
    }
}

export {
    handlingAttachments
}