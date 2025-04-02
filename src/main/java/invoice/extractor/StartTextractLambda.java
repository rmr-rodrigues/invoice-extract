package invoice.extractor;


import jakarta.enterprise.context.ApplicationScoped;
import software.amazon.awssdk.eventnotifications.s3.model.S3EventNotification;
import software.amazon.awssdk.services.textract.TextractClient;
import software.amazon.awssdk.services.textract.model.*;


import java.util.Map;

@ApplicationScoped
public class StartTextractLambda {

    private final TextractClient textractClient = TextractClient.create();

    public Map<String, String> handleRequest(S3EventNotification event) {
        var record = event.getRecords().getFirst();
        var bucket = record.getS3().getBucket().getName();
        var key = record.getS3().getObject().getKey();

        var request = StartDocumentTextDetectionRequest.builder()
                .documentLocation(doc -> doc.s3Object(s3 -> s3.bucket(bucket).name(key)))
                .notificationChannel(nc -> nc.snsTopicArn("arn:aws:sns:...").roleArn("arn:aws:iam::..."))
                .build();

        var response = textractClient.startDocumentTextDetection(request);
        return Map.of("jobId", response.jobId());
    }
}

