$(document).ready(function () {
    const reader = new FileReader();
    reader.onload = () => {
        const fileAsBinaryString = reader.result;
        console.log(fileAsBinaryString);
    }
    console.log($('.dz-file-preview'));

    
});