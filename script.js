// Espera a que el DOM esté completamente cargado antes de ejecutar el script
        document.addEventListener('DOMContentLoaded', () => {
            const container = document.querySelector('.cycle-container');

            /**
             * Función para obtener las coordenadas del centro de un elemento
             * relativas a su contenedor padre (.cycle-container).
             * Se recalcula la posición del contenedor cada vez para asegurar precisión
             * en layouts responsivos.
             * @param {string} elementId - El ID del elemento HTML.
             * @returns {{x: number, y: number}} - Un objeto con las coordenadas X e Y del centro.
             */
            function getElementCenter(elementId) {
                const element = document.getElementById(elementId);
                const rect = element.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect(); // Obtener la posición actual del contenedor
                const centerX = (rect.left + rect.right) / 2 - containerRect.left;
                const centerY = (rect.top + rect.bottom) / 2 - containerRect.top;
                return { x: centerX, y: centerY };
            }

            /**
             * Función para dibujar una línea entre dos puntos, deteniéndose en el borde de los óvalos.
             * Calcula la longitud y el ángulo de la línea y la posiciona.
             * @param {{x: number, y: number}} startCenter - Coordenadas del centro del óvalo de inicio.
             * @param {HTMLElement} startElement - El elemento HTML del óvalo de inicio.
             * @param {{x: number, y: number}} endCenter - Coordenadas del centro del óvalo de destino.
             * @param {HTMLElement} endElement - El elemento HTML del óvalo de destino.
             * @param {string} lineId - El ID del elemento HTML que representa la línea.
             */
            function drawLine(startCenter, endCenter, startElement, endElement, lineId) {
                const dx = endCenter.x - startCenter.x;
                const dy = endCenter.y - startCenter.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angleRad = Math.atan2(dy, dx);

                // Calcular el radio efectivo para el punto de inicio y fin de la línea
                // Se ha aumentado el factor de 0.9 a 0.95 para hacer las líneas más cortas y no tocar los óvalos.
                const startOffset = Math.min(startElement.offsetWidth / 2, startElement.offsetHeight / 2) * 1.55;
                const endOffset = Math.min(endElement.offsetWidth / 2, endElement.offsetHeight / 2) * 1.55;

                // Calcular los nuevos puntos de inicio y fin de la línea
                const newStartX = startCenter.x + Math.cos(angleRad) * startOffset;
                const newStartY = startCenter.y + Math.sin(angleRad) * startOffset;

                const newEndX = endCenter.x - Math.cos(angleRad) * endOffset;
                const newEndY = endCenter.y - Math.sin(angleRad) * endOffset;

                // Calcular la nueva longitud de la línea
                const newLength = Math.sqrt(Math.pow(newEndX - newStartX, 2) + Math.pow(newEndY - newStartY, 2));

                const line = document.getElementById(lineId);
                line.style.width = `${newLength}px`;
                line.style.left = `${newStartX}px`;
                line.style.top = `${newStartY}px`;
                line.style.transform = `rotate(${angleRad * 180 / Math.PI}deg)`;
            }

            /**
             * Dibuja todas las líneas del ciclo.
             * Se llama en la carga inicial y al redimensionar la ventana.
             */
            function redrawLines() {
                // Solo dibuja las líneas si el tamaño de la pantalla es mayor a 768px (no móvil)
                if (window.innerWidth > 768) {
                    const animalsElement = document.getElementById('animals-element');
                    const personElement = document.getElementById('person-element');
                    const fecesElement = document.getElementById('feces-element');

                    const animalsCenter = getElementCenter('animals-element');
                    const personCenter = getElementCenter('person-element');
                    const fecesCenter = getElementCenter('feces-element');

                    // Pasa los elementos HTML directamente a la función drawLine
                    drawLine(animalsCenter, personCenter, animalsElement, personElement, 'arrow1');
                    drawLine(personCenter, fecesCenter, personElement, fecesElement, 'arrow2');
                    drawLine(fecesCenter, animalsCenter, fecesElement, animalsElement, 'arrow3');

                    // Asegurarse de que las líneas sean visibles
                    document.getElementById('arrow1').style.display = 'block';
                    document.getElementById('arrow2').style.display = 'block';
                    document.getElementById('arrow3').style.display = 'block';

                } else {
                    // Ocultar las líneas en móvil
                    document.getElementById('arrow1').style.display = 'none';
                    document.getElementById('arrow2').style.display = 'none';
                    document.getElementById('arrow3').style.display = 'none';
                }
            }

            // Dibuja las líneas al cargar la página
            redrawLines();

            // Vuelve a dibujar las líneas al redimensionar la ventana
            window.addEventListener('resize', redrawLines);

            // --- Funcionalidad de Drag and Drop (para ratón y táctil) ---

            const draggableImages = document.querySelectorAll('.draggable-image');
            // Ahora incluimos tanto los óvalos principales como los círculos pequeños como dropzones
            const dropzones = document.querySelectorAll('.circle-element, .inset-circle');

            let draggedElement = null; // Elemento que se está arrastrando
            let initialX, initialY; // Coordenadas iniciales del toque/clic
            let currentDropZone = null; // Zona de soltar actual sobre la que se encuentra el elemento

            // Eventos para el arrastre con ratón
            draggableImages.forEach(image => {
                image.addEventListener('dragstart', (e) => {
                    draggedElement = e.target;
                    e.dataTransfer.setData('text/plain', draggedElement.id);
                    draggedElement.classList.add('opacity-50');
                });

                image.addEventListener('dragend', (e) => {
                    if (draggedElement) {
                        draggedElement.classList.remove('opacity-50');
                        draggedElement = null;
                    }
                });
            });

            // Eventos para el arrastre táctil
            draggableImages.forEach(image => {
                image.addEventListener('touchstart', (e) => {
                    draggedElement = e.target;
                    draggedElement.classList.add('opacity-50');

                    e.preventDefault(); // Previene el scroll de la página
                    const touch = e.touches[0];
                    const rect = draggedElement.getBoundingClientRect();
                    initialX = touch.clientX - rect.left;
                    initialY = touch.clientY - rect.top;

                    // Posiciona el elemento arrastrado de forma absoluta para seguir el dedo
                    draggedElement.style.position = 'absolute';
                    draggedElement.style.zIndex = 1000;
                    draggedElement.style.left = `${touch.clientX - initialX}px`;
                    draggedElement.style.top = `${touch.clientY - initialY}px`;
                }, { passive: false });

                image.addEventListener('touchmove', (e) => {
                    if (!draggedElement) return;

                    e.preventDefault(); // Previene el scroll de la página
                    const touch = e.touches[0];

                    // Actualiza la posición del elemento arrastrado
                    draggedElement.style.left = `${touch.clientX - initialX}px`;
                    draggedElement.style.top = `${touch.clientY - initialY}px`;

                    // Comprueba si está sobre una zona de soltar
                    let foundDropZone = null;
                    for (const zone of dropzones) {
                        const rect = zone.getBoundingClientRect();
                        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                            foundDropZone = zone;
                            break;
                        }
                    }

                    // Actualiza el resaltado de la zona de soltar
                    if (foundDropZone && foundDropZone !== currentDropZone) {
                        if (currentDropZone) {
                            currentDropZone.classList.remove('drag-over');
                        }
                        foundDropZone.classList.add('drag-over');
                        currentDropZone = foundDropZone;
                    } else if (!foundDropZone && currentDropZone) {
                        currentDropZone.classList.remove('drag-over');
                        currentDropZone = null;
                    }
                }, { passive: false });

                image.addEventListener('touchend', (e) => {
                    if (!draggedElement) return;

                    draggedElement.classList.remove('opacity-50');
                    // Restablece la posición del elemento arrastrado a su estado original
                    draggedElement.style.position = 'static';
                    draggedElement.style.zIndex = '';
                    draggedElement.style.left = '';
                    draggedElement.style.top = '';

                    const touch = e.changedTouches[0]; // Obtiene el toque que finalizó

                    // Determina si se soltó sobre una zona válida
                    let dropped = false;
                    // Usa elementFromPoint para obtener el elemento más específico bajo el toque
                    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
                    let finalDropZone = null;

                    if (targetElement) {
                        // Busca el ancestro más cercano que sea una zona de soltar
                        finalDropZone = targetElement.closest('.circle-element, .inset-circle');
                    }

                    if (finalDropZone) {
                        // Realiza la acción de soltar
                        if (finalDropZone.classList.contains('inset-circle')) {
                            const currentImage = finalDropZone.querySelector('img'); // Busca la imagen directamente en el inset-circle
                            if (currentImage) {
                                currentImage.src = draggedElement.src;
                                currentImage.alt = draggedElement.alt;
                            } else {
                                const newImage = document.createElement('img');
                                newImage.src = draggedElement.src;
                                newImage.alt = draggedElement.alt;
                                finalDropZone.appendChild(newImage); // Usa appendChild para agregar la imagen al inset-circle
                            }
                        } else { // Si es un circle-element principal
                            const currentImage = finalDropZone.querySelector('img:not(.inset-circle img)');
                            if (currentImage) {
                                currentImage.src = draggedElement.src;
                                currentImage.alt = draggedElement.alt;
                            } else {
                                const newImage = document.createElement('img');
                                newImage.src = draggedElement.src;
                                newImage.alt = draggedElement.alt;
                                finalDropZone.prepend(newImage);
                            }
                        }
                        finalDropZone.classList.remove('drag-over');
                        dropped = true;
                    }

                    // Eliminar la clase drag-over de cualquier zona previamente resaltada
                    if (currentDropZone) {
                        currentDropZone.classList.remove('drag-over');
                    }

                    draggedElement = null;
                    currentDropZone = null;
                });
            });

            // Eventos para las zonas de soltar (para ratón)
            dropzones.forEach(zone => {
                zone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    zone.classList.add('drag-over');
                });

                zone.addEventListener('dragleave', (e) => {
                    zone.classList.remove('drag-over');
                });

                zone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    zone.classList.remove('drag-over');

                    // Detener la propagación del evento para evitar que el drop afecte al padre
                    if (zone.classList.contains('inset-circle')) {
                        e.stopPropagation();
                    }

                    const draggedImageId = e.dataTransfer.getData('text/plain');
                    const draggedImage = document.getElementById(draggedImageId);

                    if (draggedImage) {
                        // Si la zona es un inset-circle, actualiza su imagen interna
                        if (zone.classList.contains('inset-circle')) {
                            const currentImage = zone.querySelector('img'); // Busca la imagen directamente en el inset-circle
                            if (currentImage) {
                                currentImage.src = draggedImage.src;
                                currentImage.alt = draggedImage.alt;
                            } else {
                                const newImage = document.createElement('img');
                                newImage.src = draggedImage.src;
                                newImage.alt = draggedImage.alt;
                                zone.appendChild(newImage); // Usa appendChild para agregar la imagen al inset-circle
                            }
                        } else { // Si es un circle-element principal
                            const currentImage = zone.querySelector('img:not(.inset-circle img)');
                            if (currentImage) {
                                currentImage.src = draggedImage.src;
                                currentImage.alt = draggedImage.alt;
                            } else {
                                const newImage = document.createElement('img');
                                newImage.src = draggedImage.src;
                                newImage.alt = draggedImage.alt;
                                zone.prepend(newImage);
                            }
                        }
                    }
                });
            });
        });