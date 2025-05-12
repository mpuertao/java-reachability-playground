pipeline {
    agent any

    environment {
        // Reemplaza con el ID de la credencial secreta creada en Jenkins
        SNYK_TOKEN          = credentials('SNYK_TOKEN')
        PROJECT_REPO        = 'https://github.com/mpuertao/java-reachability-playground.git'
        SONAR_SCANNER_OPTS  = "-Xmx1024m"
        SNYK_PATH          = '/opt/homebrew/bin/snyk'  
         // Configuración de OWASP Dependency Check
        DEPENDENCY_CHECK_VERSION = '8.2.1'
        DEPENDENCY_CHECK_HOME = "${WORKSPACE}/dependency-check"
        DEPENDENCY_CHECK_DATA = "${WORKSPACE}/dependency-check-data"
        
        // Configuración de OWASP ZAP
        ZAP_VERSION = '2.12.0'
        ZAP_HOME = "${WORKSPACE}/zap"
        TARGET_URL = 'https://restful-booker.herokuapp.com/' // Cambia esto por la URL de tu aplicación
        ZAP_REPORT_FORMAT = 'html'
        ZAP_REPORT_FILE = "${WORKSPACE}/zap-report.html"// Cambia esto si Snyk está en otra ubicación
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
                    if (!fileExists("${DEPENDENCY_CHECK_HOME}/bin/dependency-check.sh")) {
                        sh """
                        mkdir -p ${DEPENDENCY_CHECK_HOME}
                        wget https://github.com/jeremylong/DependencyCheck/releases/download/v${DEPENDENCY_CHECK_VERSION}/dependency-check-${DEPENDENCY_CHECK_VERSION}-release.zip -O ${WORKSPACE}/dependency-check.zip
                        unzip ${WORKSPACE}/dependency-check.zip -d ${DEPENDENCY_CHECK_HOME}
                        mv ${DEPENDENCY_CHECK_HOME}/dependency-check-${DEPENDENCY_CHECK_VERSION}/* ${DEPENDENCY_CHECK_HOME}
                        rm -rf ${WORKSPACE}/dependency-check.zip ${DEPENDENCY_CHECK_HOME}/dependency-check-${DEPENDENCY_CHECK_VERSION}
                        """
                    }

                    sh "mkdir -p ${DEPENDENCY_CHECK_DATA}"

                    sh """
                    ${DEPENDENCY_CHECK_HOME}/bin/dependency-check.sh \
                        --project "java-reachability-playground" \
                        --scan "${WORKSPACE}" \
                        --out "${WORKSPACE}/dependency-check-report.html" \
                        --data "${DEPENDENCY_CHECK_DATA}" \
                        --format HTML \
                        --disableAssembly
                    """

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


        // stage('DAST - OWASP ZAP') {
        //     steps {
        //         script {
        //             def targetURL = 'https://restful-booker.herokuapp.com/'  // Cambia por la URL real de tu app
        //             def zapDir = "${WORKSPACE}/zap"
        //             def zapVersion = "2.14.0"

        //             echo "Iniciando análisis DAST con OWASP ZAP en ${targetURL}"

        //             // Crear directorio para ZAP
        //             sh "mkdir -p ${zapDir}"
                    
        //             // Descargar ZAP si no existe
        //             sh """
        //                 if [ ! -d "${zapDir}/ZAP_${zapVersion}" ]; then
        //                     echo "Descargando OWASP ZAP..."
        //                     curl -sSL "https://github.com/zaproxy/zaproxy/releases/download/v${zapVersion}/ZAP_${zapVersion}_Cross_Platform.zip" -o ${zapDir}/zap.zip
        //                     cd ${zapDir} && unzip -q zap.zip
        //                     rm ${zapDir}/zap.zip
        //                 fi
                        
        //                 # Descargar script de baseline si no existe
        //                 if [ ! -f "${zapDir}/zap-baseline.py" ]; then
        //                     curl -sSL "https://raw.githubusercontent.com/zaproxy/zaproxy/main/docker/zap-baseline.py" -o ${zapDir}/zap-baseline.py
        //                     chmod +x ${zapDir}/zap-baseline.py
        //                 fi
        //             """
                    
        //             // Ejecutar análisis
        //             sh """
        //                 cd ${zapDir}
                        
        //                 # Iniciar ZAP en modo daemon
        //                 ./ZAP_${zapVersion}/zap.sh -daemon -host 127.0.0.1 -port 8090 -config api.disablekey=true &
        //                 ZAP_PID=\$!
                        
        //                 # Esperar a que ZAP inicie
        //                 echo "Esperando que ZAP inicie..."
        //                 sleep 30
                        
        //                 # Ejecutar análisis
        //                 python3 ./zap-baseline.py -t ${targetURL} \\
        //                     -r ${WORKSPACE}/zap_report.html \\
        //                     -J ${WORKSPACE}/zap_report.json \\
        //                     -x ${WORKSPACE}/zap_report.xml \\
        //                     -m 10 \\
        //                     -z "-config scanner.attackOnStart=true"
                        
        //                 # Detener ZAP
        //                 kill \$ZAP_PID || true
        //             """

        //             // Archivar el reporte como resultado del análisis
        //             archiveArtifacts artifacts: 'zap_report.*', fingerprint: true
        //         }
        //     }
        // }


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