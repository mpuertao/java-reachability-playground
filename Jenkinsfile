pipeline {
    agent any

    environment {
        SNYK_TOKEN          = credentials('SNYK_TOKEN')
        NVD_API_KEY         = credentials('NVD_API_KEY')  
        PROJECT_REPO        = 'https://github.com/mpuertao/java-reachability-playground.git'
        URL_WEB             = 'https://demo.bankid.com/'    
        SONAR_SCANNER_OPTS  = "-Xmx1024m"
        SNYK_PATH           = '/opt/homebrew/bin/snyk'  
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

        // stage('SCA - Análisis de Dependencias con OWASP') {
        //     steps {
        //         sh '''
        //             echo "Ejecutando OWASP Dependency-Check..."
        //             mvn org.owasp:dependency-check-maven:check \
        //                 -Dformats=HTML,JSON \
        //                 -DfailBuildOnCVSS=11 \
        //                 -DfailBuildOnAnyVulnerability=false \
        //                 -Danalyzer.nvd.api.key=${NVD_API_KEY}

        //             # Mostrar resumen de vulnerabilidades en el log
        //             if [ -f target/dependency-check-report.json ]; then
        //                 echo "============= RESUMEN DE VULNERABILIDADES ============="
        //                 grep -o '"severityLevel": "[^"]*"' target/dependency-check-report.json | sort | uniq -c || echo "No se encontraron vulnerabilidades"
        //                 echo "======================================================"
        //             fi
        //         '''
        //         archiveArtifacts artifacts: 'target/dependency-check-report.html,target/dependency-check-report.json'
        //         publishHTML([
        //             allowMissing: false,
        //             alwaysLinkToLastBuild: true,
        //             keepAll: true,
        //             reportDir: 'target',
        //             reportFiles: 'dependency-check-report.html',
        //             reportName: 'OWASP Dependency Check'
        //         ])
        //     }
        // }


    //    stage('SAST - Análisis Estático de Código con Snyk') {
    //         steps {
    //              sh '''
    //                     echo "Configurando entorno..."
    //                     export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin:$HOME/.npm-global/bin:$HOME/.nvm/versions/node/$(node -v)/bin:$HOME/.local/bin"
    //                     echo "PATH configurado: $PATH"
                        
    //                     if ! command -v snyk &> /dev/null; then
    //                         echo "Snyk no encontrado, instalando..."
    //                         npm install -g snyk || echo "Error instalando Snyk globalmente"
    //                         export PATH="$PATH:$HOME/.npm-global/bin"
    //                     fi

    //                     # Instalar snyk-to-html si no está disponible
    //                     if ! command -v snyk-to-html &> /dev/null; then
    //                         echo "snyk-to-html no encontrado, instalando..."
    //                         npm install -g snyk-to-html
    //                         export PATH="$PATH:$HOME/.npm-global/bin"
    //                     fi
                        
    //                     which snyk || echo "Snyk no encontrado en PATH"
    //                     which snyk-to-html || echo "snyk-to-html no encontrado en PATH"
    //                     snyk --version || echo "Error al obtener la versión de Snyk"
    //                     snyk auth ${SNYK_TOKEN} || echo "Error autenticando Snyk"

    //                     mkdir -p snyk-reports

    //                     snyk code test --json > snyk-reports/snyk-sast-report.json || true
    //                     snyk code test --sarif > snyk-reports/snyk-code-report.sarif || true

    //                     cat snyk-reports/snyk-sast-report.json | snyk-to-html -o snyk-reports/snyk-sast-report.html || echo "No se pudo generar el reporte HTML"

    //                     echo "============= RESUMEN DE VULNERABILIDADES SAST ============="
    //                     if [ -f snyk-reports/snyk-sast-report.json ]; then
    //                         cat snyk-reports/snyk-sast-report.json | grep -o '"severity": "[^"]*"' | sort | uniq -c || echo "No se encontraron vulnerabilidades"
    //                     else
    //                         echo "No se generó el reporte JSON"
    //                     fi

    //                     snyk monitor || echo "No se pudo enviar los resultados a Snyk Monitor"
    //                 '''
    //             archiveArtifacts artifacts: 'snyk-sast-report.json'
    //         }
    //     }

        stage('Package Artifact') {
            steps {
                sh 'mvn package -DskipTests'
                archiveArtifacts artifacts: 'target/*.jar', fingerprint: true
            }
        }

        stage('Deploy to DEV') {
            steps {
                echo "DESPLIEGUE EXITOSO for DEV environment"
            }
        }

        stage('Deploy to QA') {
            steps {
                echo "DESPLIEGUE EXITOSO for QA environment"
            }
        }

        stage('DAST - OWASP ZAP') {
            steps {
                script {
        
                    
                    def targetUrl = "${URL_WEB}"
                    
                    sh """
                        # Asegúrate de que exista el directorio para los reportes
                        mkdir -p zap-reports
    
                        # Ruta completa a Docker en Mac
                        DOCKER_PATH=/Applications/Docker.app/Contents/Resources/bin/docker
    
                        # Si no existe en esta ruta, intenta con Homebrew
                        if [ ! -f "\$DOCKER_PATH" ]; then
                            DOCKER_PATH=/opt/homebrew/bin/docker
                        fi
    
                        # Si aún no existe, intenta con la ruta estándar
                        if [ ! -f "\$DOCKER_PATH" ]; then
                            DOCKER_PATH=/usr/local/bin/docker
                        fi
    
                        echo "Usando Docker desde: \$DOCKER_PATH"
    
                        # Ejecuta ZAP con la ruta completa a Docker
                        \$DOCKER_PATH run -d --name zap-weekly -p 8090:8090 -e ZAP_PORT=8090 -i owasp/zap2docker-weekly zap.sh -daemon -port 8090 -host 0.0.0.0
    
                        sleep 30  # Dar tiempo a ZAP para iniciar
    
                        \$DOCKER_PATH exec zap-weekly zap-cli -p 8090 active-scan ${targetUrl}
                        \$DOCKER_PATH exec zap-weekly zap-cli -p 8090 report -o /zap/wrk/zap-report.html -f html
                        \$DOCKER_PATH cp zap-weekly:/zap/wrk/zap-report.html zap-reports/
                        \$DOCKER_PATH stop zap-weekly
                        \$DOCKER_PATH rm zap-weekly
                    """
                    
                    archiveArtifacts artifacts: 'zap-reports/**'
                    publishHTML([
                    
                        allowMissing: false,
                    
                        alwaysLinkToLastBuild: true,
                    
                        keepAll: true,
                    
                        reportDir: 'zap-reports',
                    
                        reportFiles: 'zap-report.html',
                    
                        reportName: 'OWASP ZAP Report'
                    
                    ])
                }       

            }       

        }

        stage('Deploy to PDN') {
            steps {
                echo "DESPLIEGUE EXITOSO for PDN environment"
            }
        }
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
