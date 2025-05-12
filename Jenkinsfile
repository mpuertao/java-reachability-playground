pipeline {
    agent any

    environment {
        // Reemplaza con el ID de la credencial secreta creada en Jenkins
        SNYK_TOKEN          = credentials('SNYK_TOKEN')
        PROJECT_REPO        = 'https://github.com/mpuertao/java-reachability-playground.git'
        SONAR_SCANNER_OPTS  = "-Xmx1024m"
        SNYK_PATH          = '/opt/homebrew/bin/snyk'  
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

        stage('SCA - Análisis de Dependencias con OWASP') {
            steps {
                sh '''
                    echo "Ejecutando OWASP Dependency-Check..."
                    mvn org.owasp:dependency-check-maven:check \
                        -Dformats=HTML,JSON \
                        -DsuppressionFile=owasp-suppressions.xml \
                        -DfailBuildOnCVSS=8
                '''
                archiveArtifacts artifacts: 'target/dependency-check-report.html,target/dependency-check-report.json'
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'target',
                    reportFiles: 'dependency-check-report.html',
                    reportName: 'OWASP Dependency Check'
                ])
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