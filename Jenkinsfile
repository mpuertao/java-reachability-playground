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


       stage('Verificar Snyk') {
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
                    '''
            }
        }

        stage('SCA - Dependencias vulnerables') {
            steps {
                // Autenticación con Snyk de forma segura sin interpolación de cadenas
                sh '''
                    snyk auth ${SNYK_TOKEN}  // Utilizamos el token de forma segura aquí
                    snyk test --all-projects --json > snyk-sca-report.json
                '''
                archiveArtifacts artifacts: 'snyk-sca-report.json'
            }
        }

        stage('SAST - Código inseguro') {
            steps {
                sh '''
                    snyk code test --json > snyk-sast-report.json || true
                '''
                archiveArtifacts artifacts: 'snyk-sast-report.json'
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

                    echo "Iniciando análisis DAST con OWASP ZAP en ${targetURL}"

                    // Si usas Docker (recomendado):
                    sh """
                        docker run -t owasp/zap2docker-stable zap-baseline.py \
                            -t ${targetURL} \
                            -r zap_report.html \
                            -x zap_report.xml \
                            -J zap_report.json \
                            -m 10
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