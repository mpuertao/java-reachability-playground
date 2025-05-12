pipeline {
    agent any

    environment {
        // Reemplaza con el ID de la credencial secreta creada en Jenkins
        SNYK_TOKEN          = credentials('SNYK_TOKEN')
        PROJECT_REPO        = 'https://github.com/mpuertao/java-reachability-playground.git'
        SONAR_SCANNER_OPTS  = "-Xmx1024m"
        SNYK_PATH          = '/opt/homebrew/bin/snyk'  // Cambia esto si Snyk está en otra ubicación
    }

    tools {
        maven 'maven 3'
    }

    stages {
        stage('Checkout') {
            steps {
                git url: "${env.PROJECT_REPO}", branch: 'master'
            }
        }

        stage('Build') {
            steps {
                sh 'mvn clean compile'
            }
        }


       stage('SAST - Análisis Estático de Código con Snyk') {
            steps {
                 sh '''
                        echo "Configurando entorno..."
                        export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin:$HOME/.npm-global/bin:$HOME/.nvm/versions/node/$(node -v)/bin:$HOME/.local/bin"
                        echo "PATH configurado: $PATH"
                        
                        # Verificar si Snyk está disponible, si no, instalarlo
                        if ! command -v snyk &> /dev/null; then
                            echo "Snyk no encontrado, instalando..."
                            npm install -g snyk || echo "Error instalando Snyk globalmente"
                            export PATH="$PATH:$HOME/.npm-global/bin"
                        fi
                        
                        # Verificar que Snyk esté accesible
                        which snyk || echo "Snyk no encontrado en PATH"
                        snyk --version || echo "Error al obtener la versión de Snyk"
                        snyk auth ${SNYK_TOKEN} || echo "Error autenticando Snyk"
                        snyk code test --json > snyk-sast-report.json || true
                    '''
                archiveArtifacts artifacts: 'snyk-sast-report.json'
            }
        }

               stage('SCA - OWASP Dependency-Check') {
            steps {
                script {
                    def dcDir = "${WORKSPACE}/dependency-check"
                    def dcVersion = "8.4.0"
                    
                    echo "Iniciando análisis SCA con OWASP Dependency-Check"
                    
                    // Crear directorio para Dependency-Check
                    sh "mkdir -p ${dcDir}"
                    
                    // Descargar Dependency-Check si no existe
                    sh """
                        if [ ! -d "${dcDir}/dependency-check-${dcVersion}" ]; then
                            echo "Descargando OWASP Dependency-Check..."
                            curl -sSL "https://github.com/jeremylong/DependencyCheck/releases/download/v${dcVersion}/dependency-check-${dcVersion}-release.zip" -o ${dcDir}/dc.zip
                            cd ${dcDir} && unzip -q dc.zip
                            
                            # Verificar la estructura del directorio descomprimido
                            echo "Verificando estructura del directorio:"
                            ls -la ${dcDir}
                            
                            rm ${dcDir}/dc.zip
                        fi
                        
                        # Verificar que el script exista y darle permisos de ejecución
                        if [ -f "${dcDir}/dependency-check/bin/dependency-check.sh" ]; then
                            chmod +x ${dcDir}/dependency-check/bin/dependency-check.sh
                            DEPENDENCY_CHECK_PATH="${dcDir}/dependency-check/bin/dependency-check.sh"
                        elif [ -f "${dcDir}/dependency-check-\${dcVersion}/bin/dependency-check.sh" ]; then
                            chmod +x ${dcDir}/dependency-check-\${dcVersion}/bin/dependency-check.sh
                            DEPENDENCY_CHECK_PATH="${dcDir}/dependency-check-\${dcVersion}/bin/dependency-check.sh"
                        else
                            # Buscar el script en caso de que la estructura sea diferente
                            echo "Buscando script dependency-check.sh..."
                            DEPENDENCY_CHECK_PATH=\$(find ${dcDir} -name "dependency-check.sh" | head -n 1)
                            if [ -z "\${DEPENDENCY_CHECK_PATH}" ]; then
                                echo "No se encontró el script dependency-check.sh"
                                exit 1
                            fi
                            chmod +x \${DEPENDENCY_CHECK_PATH}
                        fi
                        
                        echo "Usando script: \${DEPENDENCY_CHECK_PATH}"
                    """
                    
                    // Ejecutar análisis
                    sh """
                        cd ${dcDir}
                        
                        # Usar variable con la ruta al script
                        \${DEPENDENCY_CHECK_PATH} --updateonly
                        
                        # Ejecutar análisis
                        \${DEPENDENCY_CHECK_PATH} \\
                            --scan ${WORKSPACE}/target \\
                            --project "Java-Reachability-Playground" \\
                            --out ${WORKSPACE} \\
                            --format "HTML" \\
                            --format "XML" \\
                            --prettyPrint
                    """
                    
                    // Archivar el reporte como resultado del análisis
                    archiveArtifacts artifacts: 'dependency-check-report.*', fingerprint: true
                }
            }
        }

        stage('Package Artifact') {
            steps {
                sh 'mvn package -DskipTests'
                archiveArtifacts artifacts: 'target/*.jar', fingerprint: true
            }
        }

        stage('Promote to DEV') {
            steps {
                echo "DESPLIEGUE EXITOSO from DEV environment"
            }
        }

        stage('Promote to QA') {
            steps {
                echo "DESPLIEGUE EXITOSO from QA environment"
            }
        }


        stage('DAST - OWASP ZAP') {
            steps {
                script {
                    def targetURL = 'https://restful-booker.herokuapp.com/'  // Cambia por la URL real de tu app
                    def zapDir = "${WORKSPACE}/zap"
                    def zapVersion = "2.14.0"

                    echo "Iniciando análisis DAST con OWASP ZAP en ${targetURL}"

                    // Crear directorio para ZAP
                    sh "mkdir -p ${zapDir}"
                    
                    // Descargar ZAP si no existe
                    sh """
                        if [ ! -d "${zapDir}/ZAP_${zapVersion}" ]; then
                            echo "Descargando OWASP ZAP..."
                            curl -sSL "https://github.com/zaproxy/zaproxy/releases/download/v${zapVersion}/ZAP_${zapVersion}_Cross_Platform.zip" -o ${zapDir}/zap.zip
                            cd ${zapDir} && unzip -q zap.zip
                            rm ${zapDir}/zap.zip
                        fi
                        
                        # Descargar script de baseline si no existe
                        if [ ! -f "${zapDir}/zap-baseline.py" ]; then
                            curl -sSL "https://raw.githubusercontent.com/zaproxy/zaproxy/main/docker/zap-baseline.py" -o ${zapDir}/zap-baseline.py
                            chmod +x ${zapDir}/zap-baseline.py
                        fi
                    """
                    
                    // Ejecutar análisis
                    sh """
                        cd ${zapDir}
                        
                        # Iniciar ZAP en modo daemon
                        ./ZAP_${zapVersion}/zap.sh -daemon -host 127.0.0.1 -port 8090 -config api.disablekey=true &
                        ZAP_PID=\$!
                        
                        # Esperar a que ZAP inicie
                        echo "Esperando que ZAP inicie..."
                        sleep 30
                        
                        # Ejecutar análisis
                        python3 ./zap-baseline.py -t ${targetURL} \\
                            -r ${WORKSPACE}/zap_report.html \\
                            -J ${WORKSPACE}/zap_report.json \\
                            -x ${WORKSPACE}/zap_report.xml \\
                            -m 10 \\
                            -z "-config scanner.attackOnStart=true"
                        
                        # Detener ZAP
                        kill \$ZAP_PID || true
                    """

                    // Archivar el reporte como resultado del análisis
                    archiveArtifacts artifacts: 'zap_report.*', fingerprint: true
                }
            }
        }


        // stage('Analisis Estático - SonarCloud (Deuda Técnica)') {
        //     steps {
        //         withSonarQubeEnv('sonarcloud') {
        //             sh '''
        //                 mvn verify sonar:sonar -DskipTests \
        //                   -Dsonar.organization=mpuertao \
        //                   -Dsonar.projectKey=mpuertao_java-reachability-playground \
        //                   -Dsonar.sources=src \
        //                   -Dsonar.java.binaries=target/classes
        //             '''
        //         }
        //     }
        // }
    }

    post {
        always {
            echo 'Pipeline finalizado.'
        }
        failure {
            echo 'Hubo una falla en el pipeline. Revisa las etapas.'
        }
    }
}