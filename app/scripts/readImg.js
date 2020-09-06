var img = new Image();
img.src = 'app\assets\img\sample.png';
var doc = new jsPDF('p', 'mm', 'a3');  // optional parameters
doc.addImage(img, 'JPEG', 1, 2);
doc.save("new.pdf");