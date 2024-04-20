
if (localStorage.getItem('userId')) {
    
}

document.getElementById('loginForm').addEventListener('submit', async function(event) {
  event.preventDefault(); // Evita el envío del formulario por defecto
  
  const email = document.getElementById('email').value;
  const contrasena = document.getElementById('contrasena').value;
  
  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, contrasena })
    });

    if (response.ok) {
      const responseData = await response.json();
      const token = responseData.token; // O algún otro identificador

      // Almacenar el token o identificador en el almacenamiento local
      localStorage.setItem('token', token);

      // Redirigir al usuario al perfil.html
      window.location.href = "\inicio.html";
    } else {
      const errorMessage = await response.text();
      alert(errorMessage);
    }
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    alert("Error al iniciar sesión. Por favor, intenta nuevamente.");
  }
});