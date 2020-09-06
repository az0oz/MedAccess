$(document).ready(function () {
   $('.dropzone').dropzone(
      {

         init: function () 
         {
            this.on("removedfile", function (file) 
            {

               console.log($(file.previewTemplate)); 
            });
   
         }
      }
   )
 /*   $(".dz-remove").on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
       console.log('deleted');
      
       let fileName = $(this).parent().find('.dz-details').find('.dz-filename');
       console.log($(this).parent().find('.dz-details').find('.dz-filename'));
       // Get image source
       var imgElement_src = $( '.dz-filename'+num+' img' ).attr("src");
       var deleteFile = confirm("Do you really want to Delete?");
       if (deleteFile == true) {
           // AJAX request
           $.ajax({
             url: 'addremove.php',
             type: 'post',
             data: {path: imgElement_src,request: 2},
             success: function(response){
                // Remove
                if(response == 1){ 
                   $('#content_'+num).remove(); 
                } 
             } 
           }); 
        } 
      });  */
     
});

